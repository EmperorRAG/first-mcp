/**
 * MCP server orchestration service — owns {@link McpServer} instances,
 * SDK transports, the session map, tool registration, and HTTP/stdio
 * server lifecycle.
 *
 * @remarks
 * The {@link McpServerService} is the central coordinator of the
 * application.  It resolves the {@link Transport} and {@link Router}
 * services from the effect container and uses them to process inbound
 * requests without knowing the concrete wire format.
 *
 * Two execution modes are supported:
 *
 * | Mode | Behavior |
 * |------|----------|
 * | **HTTP** | Creates a `node:http` server, per-request parse→route→dispatch loop, session map |
 * | **stdio** | Single {@link McpServer} + {@link StdioServerTransport}, SDK auto-reads `stdin` |
 *
 * Tool registration is injected via a {@link ToolRegistrationFn} callback
 * passed to the {@link McpServerServiceLive} factory.
 *
 * @module
 */
import {
	createServer,
	type IncomingMessage,
} from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { StdioServerTransport } from "@modelcontextprotocol/server";
import { Context, Effect, Layer, ManagedRuntime, Ref } from "effect";
import { AppConfig } from "../../config/app/app-config.js";
import { Transport } from "../../transport/transport.js";
import { Router } from "../../router/router.js";
import { McpResponse, CORS_HEADERS } from "../../transport/mcp-response.js";
import type { McpRequest } from "../../transport/mcp-request.js";

/**
 * Callback signature for registering domain tools on an
 * {@link McpServer} instance.
 *
 * @remarks
 * The {@link McpServerService} invokes this callback once per
 * {@link McpServer} creation (once per session in HTTP mode, once at
 * startup in stdio mode).  The callback receives both the server and
 * a {@link ManagedRuntime} so that tool handlers can resolve domain
 * services via `runtime.runPromise`.
 *
 * @example
 * ```ts
 * const registerTools: ToolRegistrationFn = (server, runtime) => {
 *   registerCoffeeTools(server, runtime);
 * };
 * ```
 */
export type ToolRegistrationFn = (
	server: McpServer,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
) => void;

/**
 * Service contract for the MCP server orchestrator.
 *
 * @remarks
 * The single {@link start} method encapsulates the full server lifecycle
 * for the configured transport mode (HTTP or stdio).
 */
export interface McpServerServiceShape {
	/**
	 * Starts the MCP server in the configured transport mode.
	 *
	 * @remarks
	 * - **HTTP mode**: creates a `node:http` server, parses each
	 *   request through the {@link Transport}, routes via the
	 *   {@link Router}, and dispatches to the appropriate handler.
	 *   Registers {@link Effect.addFinalizer} for graceful shutdown.
	 * - **stdio mode**: creates a single {@link McpServer} +
	 *   {@link StdioServerTransport} and connects them.
	 *
	 * @returns An {@link Effect.Effect} that resolves once the server
	 *          is listening (HTTP) or connected (stdio).
	 */
	readonly start: () => Effect.Effect<void>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link McpServerServiceShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"McpServerService"`.  The
 * entry point (`main.ts`) resolves this tag and calls
 * {@link McpServerServiceShape.start | start()} to boot the server.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { McpServerService } from "./mcp-server.js";
 *
 * const program = Effect.gen(function* () {
 *   const svc = yield* McpServerService;
 *   yield* svc.start();
 * });
 * ```
 */
export class McpServerService extends Context.Tag("McpServerService")<
	McpServerService,
	McpServerServiceShape
>() {}

/**
 * Maps MCP session identifiers to their SDK transport and server
 * instances.
 *
 * @remarks
 * Each `POST /mcp` initialize request creates a new entry.  The
 * session ID (a {@link randomUUID} value) returned in the
 * `Mcp-Session-Id` response header is used as the key.  Entries are
 * removed when a session is explicitly terminated (`DELETE /mcp`)
 * or when the transport's `onclose` callback fires.
 *
 * @internal
 */
interface SessionEntry {
	readonly server: McpServer;
	readonly sdkTransport: NodeStreamableHTTPServerTransport;
}

/**
 * Handle returned by the HTTP server startup for lifecycle control.
 *
 * @internal
 */
interface HttpServerHandle {
	/** Closes every active SDK transport and shuts down the TCP listener. */
	close: () => Promise<void>;
	/** Returns the bound address, or `null`. */
	address: () => AddressInfo | null;
}

/**
 * Reads the full request body from an {@link IncomingMessage} stream
 * and parses it as JSON, wrapped in an Effect.
 *
 * @remarks
 * Bridges Node.js stream callbacks (`data`, `end`, `error`) into the
 * Effect world via {@link Effect.async}:
 *
 * - On `end` — concatenates chunks, decodes UTF-8, attempts
 *   `JSON.parse`.  Empty body yields `undefined`.
 * - On `error` — fails the effect with the stream error.
 * - On invalid JSON — fails with `Error("Invalid JSON")`.
 *
 * @param req - The incoming HTTP request whose body stream will be
 *        consumed.
 * @returns An {@link Effect.Effect} yielding the parsed JSON value
 *          (or `undefined`), or failing with an `Error`.
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
 * Creates the {@link McpServerServiceLive} layer parameterised by a
 * tool registration callback.
 *
 * @remarks
 * This factory function produces a {@link Layer.scoped} layer that
 * resolves {@link Transport}, {@link Router}, and {@link AppConfig}
 * from the dependency graph.  Depending on `config.mode`:
 *
 * - **HTTP**: spins up a `node:http` server with per-request
 *   parse→route→dispatch loop and session management.  Registers
 *   a finalizer for graceful shutdown.
 * - **stdio**: creates a single {@link McpServer} +
 *   {@link StdioServerTransport} and connects them.
 *
 * @param registerTools - Callback invoked once per {@link McpServer}
 *        creation to register domain tools.
 * @returns A {@link Layer} satisfying the {@link McpServerService} tag.
 */
export const McpServerServiceLive = (
	registerTools: ToolRegistrationFn,
): Layer.Layer<McpServerService, never, Transport | Router | AppConfig> =>
	Layer.scoped(
		McpServerService,
		Effect.gen(function* () {
			const transport = yield* Transport;
			const router = yield* Router;
			const config = yield* AppConfig;

			/**
			 * Creates a new {@link McpServer}, registers tools on it,
			 * and returns it.
			 *
			 * @internal
			 */
			const createMcpServer = (
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
			): McpServer => {
				const server = new McpServer({
					name: config.name,
					version: config.version,
				});
				registerTools(server, runtime);
				return server;
			};

			/**
			 * Handles a routed MCP message in HTTP mode.
			 *
			 * @internal
			 */
			const handleMcpMessage = (
				mcpReq: McpRequest,
				sessionsRef: Ref.Ref<Map<string, SessionEntry>>,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
			): Effect.Effect<void> =>
				Effect.gen(function* () {
					const sessions = yield* Ref.get(sessionsRef);

					// Existing session — forward to SDK transport
					if (mcpReq.sessionId && sessions.has(mcpReq.sessionId)) {
						const entry = sessions.get(mcpReq.sessionId)!;
						yield* transport.handleMcp(mcpReq, entry.sdkTransport);
						return;
					}

					// New session — initialize request
					if (!mcpReq.sessionId && mcpReq.isInitialize) {
						const sdkTransport = new NodeStreamableHTTPServerTransport({
							sessionIdGenerator: () => randomUUID(),
							onsessioninitialized: (sid) => {
								sessions.set(sid, { server, sdkTransport });
							},
						});

						sdkTransport.onclose = () => {
							if (sdkTransport.sessionId) {
								sessions.delete(sdkTransport.sessionId);
							}
						};

						const server = createMcpServer(runtime);
						yield* Effect.promise(() => server.connect(sdkTransport));
						yield* transport.handleMcp(mcpReq, sdkTransport);
						return;
					}

					// Invalid — no session, not initialize
					yield* transport.respond(
						mcpReq,
						new McpResponse({
							status: 400,
							body: { error: "Invalid request" },
							headers: undefined,
						}),
					);
				});

			/**
			 * Handles a routed SSE request in HTTP mode.
			 *
			 * @internal
			 */
			const handleMcpSse = (
				mcpReq: McpRequest,
				sessionsRef: Ref.Ref<Map<string, SessionEntry>>,
			): Effect.Effect<void> =>
				Effect.gen(function* () {
					const sessions = yield* Ref.get(sessionsRef);
					if (mcpReq.sessionId && sessions.has(mcpReq.sessionId)) {
						const entry = sessions.get(mcpReq.sessionId)!;
						yield* transport.handleMcp(mcpReq, entry.sdkTransport);
						return;
					}
					yield* transport.respond(
						mcpReq,
						new McpResponse({
							status: 400,
							body: { error: "Invalid or missing session" },
							headers: undefined,
						}),
					);
				});

			/**
			 * Handles session termination in HTTP mode.
			 *
			 * @internal
			 */
			const handleSessionTerminate = (
				mcpReq: McpRequest,
				sessionsRef: Ref.Ref<Map<string, SessionEntry>>,
			): Effect.Effect<void> =>
				Effect.gen(function* () {
					const sessions = yield* Ref.get(sessionsRef);
					if (mcpReq.sessionId && sessions.has(mcpReq.sessionId)) {
						const entry = sessions.get(mcpReq.sessionId)!;
						yield* Effect.promise(() => entry.sdkTransport.close());
						sessions.delete(mcpReq.sessionId);
						yield* transport.respond(
							mcpReq,
							new McpResponse({
								status: 200,
								body: undefined,
								headers: undefined,
							}),
						);
						return;
					}
					yield* transport.respond(
						mcpReq,
						new McpResponse({
							status: 400,
							body: { error: "Invalid or missing session" },
							headers: undefined,
						}),
					);
				});

			/**
			 * Starts the HTTP server and returns a handle.
			 *
			 * @internal
			 */
			const startHttp = (
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
			): Effect.Effect<HttpServerHandle> =>
				Effect.gen(function* () {
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
										yield* handleMcpMessage(mcpReq, sessionsRef, runtime);
										break;
									case "mcp-sse":
										yield* handleMcpSse(mcpReq, sessionsRef);
										break;
									case "session-terminate":
										yield* handleSessionTerminate(mcpReq, sessionsRef);
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
						httpServer.listen(config.port, "0.0.0.0", () => {
							resume(Effect.void);
						});
					});

					yield* Effect.logInfo(
						`MCP Server running on http://0.0.0.0:${config.port}`,
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

			/**
			 * Starts the stdio transport.
			 *
			 * @internal
			 */
			const startStdio = (
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
			): Effect.Effect<void> =>
				Effect.gen(function* () {
					const sdkTransport = new StdioServerTransport();
					const server = createMcpServer(runtime);
					yield* Effect.promise(() => server.connect(sdkTransport));
					yield* Effect.logInfo("MCP Server running on stdio");
				});

			// --- Service implementation ---

			const handleRef = yield* Ref.make<HttpServerHandle | null>(null);

			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					const handle = yield* Ref.get(handleRef);
					if (handle) {
						yield* Effect.promise(() => handle.close());
						yield* Effect.logInfo("HTTP server closed");
					}
				}),
			);

			return {
				start: () =>
					Effect.gen(function* () {
						// Build a layer with all the services the MCP server needs
						const appLayer = Layer.mergeAll(
							Layer.succeed(Transport, transport),
							Layer.succeed(Router, router),
							Layer.succeed(AppConfig, config),
						);
						const runtime = ManagedRuntime.make(appLayer);

						if (config.mode === "http") {
							const handle = yield* startHttp(runtime);
							yield* Ref.set(handleRef, handle);
						} else {
							yield* startStdio(runtime);
						}
					}),
			} satisfies McpServerServiceShape;
		}),
	);
