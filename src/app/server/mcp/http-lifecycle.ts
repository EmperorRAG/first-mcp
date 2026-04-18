/**
 * HTTP server lifecycle — creates and manages the `node:http` server,
 * per-request parse→route→dispatch loop, and graceful shutdown.
 *
 * @remarks
 * Encapsulates all HTTP-specific server orchestration:
 *
 * 1. Creates a session {@link Ref} for tracking active MCP sessions.
 * 2. Spins up a `node:http` server with a per-request handler that
 *    parses the body, routes the request, and dispatches to the
 *    appropriate session handler or transport responder.
 * 3. Returns an {@link HttpServerHandle} for lifecycle control.
 *
 * @module
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { McpServer } from "@modelcontextprotocol/server";
import { Effect, type ManagedRuntime, Ref } from "effect";
import type { TransportShape } from "../../transport/transport.js";
import type { RouterShape } from "../../router/router.js";
import { McpResponse, CORS_HEADERS } from "../../transport/mcp-response.js";
import { parseBody } from "./body-parser.js";
import {
	type SessionEntry,
	handleMcpMessage,
	handleMcpSse,
	handleSessionTerminate,
} from "./session.js";

/**
 * Handle returned by the HTTP server startup for lifecycle control.
 *
 * @remarks
 * Provides {@link close} for graceful shutdown (closes all active SDK
 * transports and the TCP listener) and {@link address} for inspecting
 * the bound network address.
 */
export interface HttpServerHandle {
	/** Closes every active SDK transport and shuts down the TCP listener. */
	close: () => Promise<void>;
	/** Returns the bound address, or `null`. */
	address: () => AddressInfo | null;
}

/**
 * Dependencies required by {@link startHttp}.
 *
 * @remarks
 * Passed as a single object to avoid long parameter lists and improve
 * readability.  All fields are resolved from the Effect layer by the
 * caller ({@link McpServerServiceLive}).
 *
 * @internal
 */
interface StartHttpDeps {
	readonly port: number;
	readonly transport: TransportShape;
	readonly router: RouterShape;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly runtime: ManagedRuntime.ManagedRuntime<any, unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly createMcpServerFn: (runtime: ManagedRuntime.ManagedRuntime<any, unknown>) => McpServer;
}

/**
 * Starts the HTTP server and returns a lifecycle handle.
 *
 * @remarks
 * Execution steps:
 *
 * 1. Creates an Effect {@link Ref} holding the session map.
 * 2. Creates a `node:http` server with a per-request handler that:
 *    - Parses the body via {@link parseBody}.
 *    - Converts raw input to an {@link McpRequest} via
 *      `transport.parse`.
 *    - Routes via `router.resolve` to a {@link RouteAction}.
 *    - Dispatches to the session handlers or responds directly.
 *    - Catches all errors and returns HTTP 500 if headers not sent.
 * 3. Binds the server to `0.0.0.0:{port}`.
 * 4. Returns an {@link HttpServerHandle} for shutdown.
 *
 * @param deps - Resolved dependencies from the Effect layer.
 * @returns An {@link Effect.Effect} yielding the server handle.
 */
export const startHttp = (
	deps: StartHttpDeps,
): Effect.Effect<HttpServerHandle> =>
	Effect.gen(function* () {
		const { port, transport, router, runtime, createMcpServerFn } = deps;

		const sessionsRef = yield* Ref.make<Map<string, SessionEntry>>(
			new Map(),
		);

		const httpServer = createServer((req, res) => {
			void Effect.runPromise(
				Effect.gen(function* () {
					const body = yield* parseBody(req);
					const mcpReq = yield* transport.parse({ req, res, body });
					const action = yield* router.resolve(mcpReq);

					switch (action) {
						case "mcp-message":
							yield* handleMcpMessage(mcpReq, sessionsRef, runtime, transport, createMcpServerFn);
							break;
						case "mcp-sse":
							yield* handleMcpSse(mcpReq, sessionsRef, transport);
							break;
						case "session-terminate":
							yield* handleSessionTerminate(mcpReq, sessionsRef, transport);
							break;
						case "health-check":
							yield* transport.respond(
								mcpReq,
								new McpResponse({
									status: 200,
									body: { status: "ok" },
									headers: undefined,
								}),
							);
							break;
						case "cors-preflight":
							yield* transport.respond(
								mcpReq,
								new McpResponse({
									status: 204,
									body: undefined,
									// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
									headers: CORS_HEADERS as Record<string, string>,
								}),
							);
							break;
						case "not-found":
							yield* transport.respond(
								mcpReq,
								new McpResponse({
									status: 404,
									body: { error: "Not found" },
									headers: undefined,
								}),
							);
							break;
						case "forbidden":
							yield* transport.respond(
								mcpReq,
								new McpResponse({
									status: 403,
									body: { error: "DNS rebinding protection" },
									headers: undefined,
								}),
							);
							break;
					}
				}).pipe(
					Effect.catchAll(() =>
						Effect.sync(() => {
							if (!res.headersSent) {
								const json = JSON.stringify({
									error: "Internal server error",
								});
								res.writeHead(500, {
									...CORS_HEADERS,
									"Content-Type": "application/json",
									"Content-Length": Buffer.byteLength(json),
								});
								res.end(json);
							}
						}),
					),
				),
			);
		});

		yield* Effect.async<void>((resume) => {
			httpServer.listen(port, "0.0.0.0", () => {
				resume(Effect.void);
			});
		});

		yield* Effect.logInfo(
			`MCP Server running on http://0.0.0.0:${port}`,
		);

		const close = async (): Promise<void> => {
			const sessions = await Effect.runPromise(Ref.get(sessionsRef));
			for (const [, entry] of sessions) {
				await entry.sdkTransport.close();
			}
			sessions.clear();
			await new Promise<void>((resolve) =>
				httpServer.close(() => resolve()),
			);
		};

		return {
			close,
			address: () => {
				const addr = httpServer.address();
				return typeof addr === "string" ? null : addr;
			},
		} satisfies HttpServerHandle;
	});
