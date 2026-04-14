/**
 * Streamable HTTP transport — raw `node:http` server with Effect-managed
 * lifecycle, stateful MCP session management, a health endpoint, and DNS
 * rebinding protection.
 *
 * @remarks
 * This module replaces the former Express-based transport with a plain
 * {@link createServer | node:http.createServer} implementation.  Active
 * MCP sessions are tracked in an Effect {@link Ref} holding a
 * {@link TransportMap} (session-ID → transport).  The map is populated on
 * `initialize` requests and pruned on explicit `DELETE /mcp` terminations
 * or transport `onclose` callbacks.  All entries are drained during
 * graceful shutdown via {@link HttpServerHandle.close}.
 *
 * Exposed endpoints:
 *
 * | Method | Path | Purpose |
 * |--------|------|---------|
 * | `GET` | `/health` | Liveness probe (`{ status: "ok" }`) |
 * | `POST` | `/mcp` | Primary MCP message ingress |
 * | `GET` | `/mcp` | SSE backward-compatibility stream |
 * | `DELETE` | `/mcp` | Explicit session termination |
 * | `OPTIONS` | `*` | CORS preflight |
 *
 * @module
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/server";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { Effect, Ref } from "effect";

/**
 * Default CORS response headers attached to every HTTP response.
 *
 * @remarks
 * Permits cross-origin requests from any origin (`*`) and exposes the
 * MCP-specific headers (`Mcp-Session-Id`, `Mcp-Protocol-Version`) that
 * clients need to read from responses.  The `WWW-Authenticate` header is
 * also exposed to support future authentication challenges.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS | MDN — Cross-Origin Resource Sharing}
 *
 * @internal
 */
const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
	"Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version, WWW-Authenticate",
};

/**
 * Extracts the `Mcp-Session-Id` header value from an incoming HTTP request.
 *
 * @remarks
 * The MCP Streamable HTTP transport uses the `Mcp-Session-Id` header to
 * correlate requests to an existing server-side
 * {@link NodeStreamableHTTPServerTransport} instance.  When Node.js parses
 * duplicate headers it returns an array, so this helper normalizes the
 * value to a single `string` (taking the first element) or `undefined`
 * when the header is absent.
 *
 * @param req - The incoming HTTP request whose headers are inspected.
 * @returns The session identifier string, or `undefined` if the header is missing.
 *
 * @internal
 */
function getSessionId(req: IncomingMessage): string | undefined {
	const value = req.headers["mcp-session-id"];
	return Array.isArray(value) ? value[0] : value;
}

/**
 * Serializes `body` as JSON and writes it to the HTTP response with the
 * given status code, CORS headers, and correct `Content-Length`.
 *
 * @remarks
 * Every JSON response shares the same {@link CORS_HEADERS} so that
 * browser-based MCP clients can read the payload.  `Content-Length` is
 * computed with {@link Buffer.byteLength} to handle multi-byte UTF-8
 * characters correctly.
 *
 * @param res - The Node.js {@link ServerResponse} to write to.
 * @param status - HTTP status code (e.g. `200`, `400`, `500`).
 * @param body - Any JSON-serialisable value to send as the response body.
 *
 * @internal
 */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
	const json = JSON.stringify(body);
	res.writeHead(status, {
		...CORS_HEADERS,
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(json),
	});
	res.end(json);
}

/**
 * Reads the full request body from an {@link IncomingMessage} stream and
 * parses it as JSON, wrapped in an Effect.
 *
 * @remarks
 * Because one cannot re-read a consumed Node.js readable stream, the raw
 * body must be buffered before the MCP SDK can inspect it.  The effect
 * uses {@link Effect.async} to bridge the Node.js stream event callbacks
 * (`data`, `end`, `error`) into the Effect world:
 *
 * - On `end` — concatenates all chunks, decodes as UTF-8, and attempts
 *   `JSON.parse`.  An empty body yields `undefined`.
 * - On `error` — fails the effect with the stream error.
 * - On invalid JSON — fails the effect with an `Error("Invalid JSON")`.
 *
 * @param req - The incoming HTTP request whose body stream will be consumed.
 * @returns An {@link Effect.Effect} that succeeds with the parsed JSON value
 *          (or `undefined` for an empty body), or fails with an `Error`.
 *
 * @internal
 */
const parseBody = (req: IncomingMessage): Effect.Effect<unknown, Error> =>
	Effect.async<unknown, Error>((resume) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => chunks.push(chunk));
		req.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf8");
			try {
				resume(Effect.succeed(raw.length > 0 ? JSON.parse(raw) : undefined));
			} catch {
				resume(Effect.fail(new Error("Invalid JSON")));
			}
		});
		req.on("error", (err) => resume(Effect.fail(err)));
	});

/**
 * Validates that the `Host` header resolves to a loopback address,
 * protecting against DNS rebinding attacks.
 *
 * @remarks
 * DNS rebinding is a technique where an attacker's domain initially
 * resolves to a public IP (passing same-origin checks) and then
 * re-resolves to `127.0.0.1`, allowing malicious scripts to reach
 * local services.  By accepting only known loopback hostnames
 * (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`) the server rejects
 * requests whose `Host` header was set by an attacker-controlled DNS.
 *
 * The port suffix (e.g. `:3001`) is stripped before comparison.
 *
 * @param host - The raw `Host` header value, which may include a port.
 * @returns `true` when the hostname portion is a recognized loopback
 *          address; `false` otherwise (including when `host` is `undefined`).
 *
 * @see {@link https://owasp.org/www-community/attacks/DNS_Rebinding | OWASP — DNS Rebinding}
 *
 * @internal
 */
function isValidHost(host: string | undefined): boolean {
	if (!host) return false;
	const hostname = host.split(":")[0];
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "0.0.0.0" ||
		hostname === "::1"
	);
}

/**
 * Handle returned by {@link startHttpServer} for lifecycle control of the
 * underlying `node:http` server and its active MCP session transports.
 *
 * @remarks
 * Callers receive this handle after the HTTP server is listening.  It
 * provides two capabilities:
 *
 * - **Graceful shutdown** via {@link HttpServerHandle.close | close()} —
 *   iterates every active {@link NodeStreamableHTTPServerTransport} in the
 *   internal {@link TransportMap}, closes them, then shuts down the TCP
 *   listener.  This ensures in-flight SSE streams and pending responses
 *   are terminated cleanly.
 *
 * - **Address introspection** via {@link HttpServerHandle.address | address()} —
 *   returns the bound {@link AddressInfo} (host, port, family), which is
 *   especially useful when the server was started on ephemeral port `0`
 *   (common in tests).
 */
export interface HttpServerHandle {
	/**
	 * Closes every active {@link NodeStreamableHTTPServerTransport}, clears
	 * the internal session map, and shuts down the TCP listener.
	 *
	 * @returns A `Promise` that resolves once the server is fully stopped.
	 */
	close: () => Promise<void>;
	/**
	 * Returns the network address the server is bound to, or `null` if
	 * the server returned a UNIX socket path string (not applicable here
	 * but part of the Node.js {@link import("node:net").Server.address}
	 * contract).
	 *
	 * @returns The bound {@link AddressInfo} containing `address`, `port`,
	 *          and `family`, or `null`.
	 */
	address: () => AddressInfo | null;
}

/**
 * Maps MCP session identifiers to their corresponding
 * {@link NodeStreamableHTTPServerTransport} instances.
 *
 * @remarks
 * Each `POST /mcp` initialize request creates a new transport.  The
 * session ID (a {@link randomUUID | crypto.randomUUID} value) returned in
 * the `Mcp-Session-Id` response header is used as the key.  Subsequent
 * requests reuse the existing transport by looking up this map via the
 * `Mcp-Session-Id` request header.  Entries are removed when a session is
 * explicitly terminated (`DELETE /mcp`) or when the transport's `onclose`
 * callback fires.
 *
 * The map is held inside an Effect {@link Ref} so that it can be safely
 * read and mutated within the Effect runtime.
 *
 * @internal
 */
type TransportMap = Map<string, NodeStreamableHTTPServerTransport>;

/**
 * Handles `POST /mcp` requests — the primary MCP message ingress.
 *
 * @remarks
 * Two distinct code paths exist:
 *
 * 1. **Existing session** — If the request carries a valid
 *    `Mcp-Session-Id` header that maps to a known transport, the body is
 *    forwarded to that transport's
 *    {@link NodeStreamableHTTPServerTransport.handleRequest | handleRequest}.
 *
 * 2. **New session (initialize)** — If there is *no* session header and
 *    the body is a JSON-RPC `initialize` request (detected by
 *    {@link isInitializeRequest}), a fresh
 *    {@link NodeStreamableHTTPServerTransport} is created with a
 *    {@link randomUUID}-based session ID generator.  A new
 *    {@link McpServer} is connected to the transport and the request is
 *    then handled.  The transport's `onsessioninitialized` callback
 *    registers the session in the shared {@link TransportMap}, and the
 *    `onclose` callback removes it.
 *
 * Any other combination (e.g. a non-initialize request with no session)
 * returns HTTP `400 Invalid request`.
 *
 * @param req - The incoming HTTP request.
 * @param res - The server response to write to.
 * @param transportsRef - Effect {@link Ref} holding the active {@link TransportMap}.
 * @param createServer_ - Factory that creates a fresh {@link McpServer} per session.
 * @returns An {@link Effect.Effect} that resolves after the response is sent,
 *          or fails with an `Error` if body parsing fails.
 *
 * @internal
 */
const handlePost = (
	req: IncomingMessage,
	res: ServerResponse,
	transportsRef: Ref.Ref<TransportMap>,
	createServer_: () => McpServer,
): Effect.Effect<void, Error> =>
	Effect.gen(function* () {
		const body = yield* parseBody(req);
		const sessionId = getSessionId(req);
		const transports = yield* Ref.get(transportsRef);

		if (sessionId && transports.has(sessionId)) {
			yield* Effect.promise(() => transports.get(sessionId)!.handleRequest(req, res, body));
			return;
		}

		if (!sessionId && isInitializeRequest(body)) {
			const transport = new NodeStreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sid) => {
					transports.set(sid, transport);
				},
			});

			transport.onclose = () => {
				if (transport.sessionId) {
					transports.delete(transport.sessionId);
				}
			};

			const server = createServer_();
			yield* Effect.promise(() => server.connect(transport));
			yield* Effect.promise(() => transport.handleRequest(req, res, body));
			return;
		}

		sendJson(res, 400, { error: "Invalid request" });
	});

/**
 * Handles `GET /mcp` requests — the SSE backward-compatibility endpoint.
 *
 * @remarks
 * Legacy MCP clients may use Server-Sent Events (SSE) instead of
 * Streamable HTTP.  A valid `Mcp-Session-Id` header must be present and
 * must match an active transport; the request is then delegated to
 * {@link NodeStreamableHTTPServerTransport.handleRequest | handleRequest}
 * which upgrades the connection to an SSE stream.
 *
 * Requests with a missing or unknown session receive HTTP `400`.
 *
 * @param req - The incoming HTTP request.
 * @param res - The server response to write to.
 * @param transportsRef - Effect {@link Ref} holding the active {@link TransportMap}.
 * @returns An {@link Effect.Effect} that resolves after the SSE stream is
 *          handed off, or after the `400` error is sent.
 *
 * @internal
 */
const handleGet = (
	req: IncomingMessage,
	res: ServerResponse,
	transportsRef: Ref.Ref<TransportMap>,
): Effect.Effect<void> =>
	Effect.gen(function* () {
		const sessionId = getSessionId(req);
		const transports = yield* Ref.get(transportsRef);

		if (sessionId && transports.has(sessionId)) {
			yield* Effect.promise(() => transports.get(sessionId)!.handleRequest(req, res));
			return;
		}

		sendJson(res, 400, { error: "Invalid or missing session" });
	});

/**
 * Handles `DELETE /mcp` requests — explicit session termination.
 *
 * @remarks
 * When a client sends `DELETE /mcp` with a valid `Mcp-Session-Id`, the
 * corresponding {@link NodeStreamableHTTPServerTransport} is closed and
 * removed from the shared {@link TransportMap}.  The response is a bare
 * `200 OK` with CORS headers and no body.
 *
 * Requests with a missing or unknown session receive HTTP `400`.
 *
 * @param req - The incoming HTTP request.
 * @param res - The server response to write to.
 * @param transportsRef - Effect {@link Ref} holding the active {@link TransportMap}.
 * @returns An {@link Effect.Effect} that resolves after the transport is
 *          closed and the response is sent, or after the `400` error.
 *
 * @internal
 */
const handleDelete = (
	req: IncomingMessage,
	res: ServerResponse,
	transportsRef: Ref.Ref<TransportMap>,
): Effect.Effect<void> =>
	Effect.gen(function* () {
		const sessionId = getSessionId(req);
		const transports = yield* Ref.get(transportsRef);

		if (sessionId && transports.has(sessionId)) {
			const transport = transports.get(sessionId)!;
			yield* Effect.promise(() => transport.close());
			transports.delete(sessionId);
			res.writeHead(200, CORS_HEADERS);
			res.end();
			return;
		}

		sendJson(res, 400, { error: "Invalid or missing session" });
	});

/**
 * Top-level request dispatcher invoked for every incoming HTTP request.
 *
 * @remarks
 * Performs the following checks and routing in order:
 *
 * 1. **DNS rebinding guard** — Rejects requests whose `Host` header does
 *    not resolve to a loopback address (see {@link isValidHost}).  Returns
 *    HTTP `403`.
 *
 * 2. **CORS preflight** — Responds to `OPTIONS` with `204 No Content` and
 *    the shared {@link CORS_HEADERS}.
 *
 * 3. **Health probe** — `GET /health` returns `{"status":"ok"}` (used by
 *    Docker and load-balancer health checks).
 *
 * 4. **MCP endpoints** — `POST /mcp`, `GET /mcp`, and `DELETE /mcp` are
 *    delegated to {@link handlePost}, {@link handleGet}, and
 *    {@link handleDelete} respectively.
 *
 * 5. **Fallback** — Any other path or method returns HTTP `404`.
 *
 * The entire pipeline is wrapped in {@link Effect.catchAll} so that any
 * unhandled errors result in a `500 Internal server error` JSON response
 * (provided headers have not already been sent).
 *
 * @param req - The incoming HTTP request.
 * @param res - The server response to write to.
 * @param transportsRef - Effect {@link Ref} holding the active {@link TransportMap}.
 * @param createServer_ - Factory that creates a fresh {@link McpServer} per session.
 * @returns An {@link Effect.Effect} that always succeeds (errors are caught
 *          internally and written to the response).
 *
 * @internal
 */
const handleIncoming = (
	req: IncomingMessage,
	res: ServerResponse,
	transportsRef: Ref.Ref<TransportMap>,
	createServer_: () => McpServer,
): Effect.Effect<void> =>
	Effect.gen(function* () {
		if (!isValidHost(req.headers.host)) {
			sendJson(res, 403, { error: "DNS rebinding protection" });
			return;
		}

		const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
		const path = url.pathname;

		if (req.method === "OPTIONS") {
			res.writeHead(204, CORS_HEADERS);
			res.end();
			return;
		}

		if (path === "/health" && req.method === "GET") {
			sendJson(res, 200, { status: "ok" });
		} else if (path === "/mcp" && req.method === "POST") {
			yield* handlePost(req, res, transportsRef, createServer_);
		} else if (path === "/mcp" && req.method === "GET") {
			yield* handleGet(req, res, transportsRef);
		} else if (path === "/mcp" && req.method === "DELETE") {
			yield* handleDelete(req, res, transportsRef);
		} else {
			sendJson(res, 404, { error: "Not found" });
		}
	}).pipe(
		Effect.catchAll(() =>
			Effect.sync(() => {
				if (!res.headersSent) {
					sendJson(res, 500, { error: "Internal server error" });
				}
			}),
		),
	);

/**
 * Creates and starts a raw `node:http` server wired to the MCP Streamable
 * HTTP transport, returning an {@link HttpServerHandle} for lifecycle
 * control.
 *
 * @remarks
 * Internally the function:
 *
 * 1. Allocates an Effect {@link Ref} holding an empty {@link TransportMap}
 *    to track active MCP sessions.
 * 2. Creates a `node:http` server whose request listener delegates every
 *    incoming request to {@link handleIncoming} via
 *    {@link Effect.runPromise}.
 * 3. Binds the server to `0.0.0.0` on the given `port` (use `0` for an
 *    OS-assigned ephemeral port, useful in tests).
 * 4. Logs the listening address via {@link Effect.logInfo}.
 *
 * The returned {@link HttpServerHandle.close | close()} method performs
 * graceful shutdown: it iterates all active transports, closes each one,
 * clears the session map, and finally closes the TCP listener.
 *
 * @param createServer_ - Factory invoked once per MCP `initialize`
 *        request to produce a new, fully-configured {@link McpServer}
 *        instance for that session.
 * @param port - TCP port number to listen on.  Pass `0` to let the OS
 *        assign an ephemeral port (retrieve the actual port via
 *        {@link HttpServerHandle.address}).
 * @returns An {@link Effect.Effect} that succeeds with an
 *          {@link HttpServerHandle} once the server is listening.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { startHttpServer } from "./http-transport.js";
 *
 * const handle = await Effect.runPromise(
 *   startHttpServer(() => createMcpServer(), 3001),
 * );
 * // … later …
 * await handle.close();
 * ```
 */
export const startHttpServer = (
	createServer_: () => McpServer,
	port: number,
): Effect.Effect<HttpServerHandle> =>
	Effect.gen(function* () {
		const transportsRef = yield* Ref.make<TransportMap>(new Map());

		const httpServer = createServer((req, res) => {
			void Effect.runPromise(handleIncoming(req, res, transportsRef, createServer_));
		});

		yield* Effect.async<void>((resume) => {
			httpServer.listen(port, "0.0.0.0", () => {
				resume(Effect.void);
			});
		});

		yield* Effect.logInfo(`MCP Server running on http://0.0.0.0:${port}`);

		const close = async (): Promise<void> => {
			const transports = await Effect.runPromise(Ref.get(transportsRef));
			for (const [, transport] of transports) {
				await transport.close();
			}
			transports.clear();
			await new Promise<void>((resolve) => httpServer.close(() => resolve()));
		};

		return {
			close,
			address: () => {
				const addr = httpServer.address();
				return typeof addr === "string" ? null : addr;
			},
		} satisfies HttpServerHandle;
	});
