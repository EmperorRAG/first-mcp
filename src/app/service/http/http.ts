/**
 * HTTP listener — {@link Context.Tag} and {@link Layer} that creates
 * a `node:http` server, dispatches requests through the transport and
 * router layers, and delegates session management to
 * {@link McpService}.
 *
 * @remarks
 * Encapsulates all HTTP-specific server orchestration:
 *
 * 1. Creates a `node:http` server with a per-request handler that
 *    parses the body, routes the request, and dispatches to the
 *    appropriate session handler or transport responder.
 * 2. Delegates session CRUD to {@link McpService}.
 * 3. Returns start / stop lifecycle methods.
 *
 * @module
 */
import { createServer, type Server } from "node:http";
import { Context, Effect, Either, Layer, Ref } from "effect";
import { Transport, type TransportShape } from "../../transport/transport.js";
import { Router, type RouterShape } from "../../router/router.js";
import { McpResponse, CORS_HEADERS } from "../../schema/response/mcp-response.js";
import { AppConfig } from "../../config/app/app-config.js";
import { McpService } from "../mcp/mcp.service.js";
import { SessionNotFoundError } from "../mcp/shared/error/session-not-found/session-not-found.js";
import { parseBody } from "./body-parser/body-parser.js";

/**
 * Service contract for the HTTP listener.
 *
 * @remarks
 * Provides {@link start} to bind the TCP server and begin accepting
 * requests, and {@link stop} to close the TCP server and tear down
 * all MCP sessions.
 */
export interface HttpListenerShape {
	/** Binds the TCP server and begins accepting requests. */
	readonly start: () => Effect.Effect<void>;
	/** Closes the TCP server and all MCP sessions. */
	readonly stop: () => Effect.Effect<void>;
	/** Returns the bound TCP port (available after {@link start}). */
	readonly port: () => Effect.Effect<number>;
	/** Returns the bound address string (available after {@link start}). */
	readonly address: () => Effect.Effect<string>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link HttpListenerShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"HttpListener"`.
 */
export class HttpListener extends Context.Tag("HttpListener")<
	HttpListener,
	HttpListenerShape
>() { }

/**
 * Handles the per-request dispatch loop for the HTTP server.
 *
 * @remarks
 * Parses the body, routes, and dispatches to the appropriate handler.
 * Session CRUD is delegated to {@link McpService}.
 *
 * @param transport - The resolved {@link TransportShape}.
 * @param router - The resolved {@link RouterShape}.
 * @param mcpSvc - The resolved {@link McpService}.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 *
 * @internal
 */
const handleRequest = (
	transport: TransportShape,
	router: RouterShape,
	mcpSvc: McpService,
	req: import("node:http").IncomingMessage,
	res: import("node:http").ServerResponse,
): void => {
	void Effect.runPromise(
		Effect.gen(function* () {
			const body = yield* parseBody(req);
			const mcpReq = yield* transport.parse({ req, res, body });
			const action = yield* router.resolve(mcpReq);

			switch (action) {
				case "mcp-message": {
					// Existing session — forward to SDK transport
					if (mcpReq.sessionId) {
						const result = yield* Effect.either(
							mcpSvc.getSession(mcpReq.sessionId),
						);
						if (Either.isRight(result)) {
							yield* transport.handleMcp(
								mcpReq,
								result.right.sdkTransport,
							);
							return;
						}
					}

					// New session — initialize request
					if (mcpReq.isInitialize) {
						const session = yield* mcpSvc.setSession();
						yield* transport.handleMcp(mcpReq, session.sdkTransport);
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
					break;
				}
				case "mcp-sse": {
					if (mcpReq.sessionId) {
						const session = yield* mcpSvc.getSession(mcpReq.sessionId);
						yield* transport.handleMcp(mcpReq, session.sdkTransport);
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
					break;
				}
				case "session-terminate": {
					if (mcpReq.sessionId) {
						yield* mcpSvc.getSession(mcpReq.sessionId);
						yield* mcpSvc.deleteSession(mcpReq.sessionId);
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
					break;
				}
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
			Effect.catchAll((e) =>
				Effect.sync(() => {
					if (!res.headersSent) {
						const isSessionError = e instanceof SessionNotFoundError;
						const status = isSessionError ? 400 : 500;
						const body = isSessionError
							? { error: "Invalid or missing session" }
							: { error: "Internal server error" };
						const json = JSON.stringify(body);
						res.writeHead(status, {
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
};

/**
 * Live {@link Layer} providing the {@link HttpListener} service.
 *
 * @remarks
 * Dependencies:
 *
 * - {@link Transport} — request/response parsing
 * - {@link Router} — route matching
 * - {@link McpService} — session CRUD
 * - {@link AppConfig} — port binding
 *
 * Creates a `node:http` server but does not bind it until
 * {@link HttpListenerShape.start | start()} is called.
 */
export const HttpListenerLive: Layer.Layer<HttpListener, never, Transport | Router | McpService | AppConfig> =
	Layer.effect(
		HttpListener,
		Effect.gen(function* () {
			const transport = yield* Transport;
			const router = yield* Router;
			const mcpSvc = yield* McpService;
			const config = yield* AppConfig;

			const serverRef = yield* Ref.make<Server | null>(null);

			return {
				start: () =>
					Effect.gen(function* () {
						const httpServer = createServer((req, res) => {
							handleRequest(transport, router, mcpSvc, req, res);
						});

						yield* Effect.async<void>((resume) => {
							httpServer.listen(config.port, "0.0.0.0", () => {
								resume(Effect.void);
							});
						});

						yield* Ref.set(serverRef, httpServer);
						yield* Effect.logInfo(
							`MCP Server running on http://0.0.0.0:${config.port}`,
						);
					}),

				stop: () =>
					Effect.gen(function* () {
						yield* mcpSvc.stop();

						const httpServer = yield* Ref.get(serverRef);
						if (httpServer) {
							yield* Effect.promise(
								() =>
									new Promise<void>((resolve) =>
										httpServer.close(() => resolve()),
									),
							);
							yield* Ref.set(serverRef, null);
							yield* Effect.logInfo("HTTP server closed");
						}
					}),

				port: () =>
					Effect.gen(function* () {
						const httpServer = yield* Ref.get(serverRef);
						if (!httpServer) return yield* Effect.die(new Error("HTTP server not started"));
						const addr = httpServer.address();
						if (!addr || typeof addr === "string") return yield* Effect.die(new Error("Unexpected address format"));
						return addr.port;
					}),

				address: () =>
					Effect.gen(function* () {
						const httpServer = yield* Ref.get(serverRef);
						if (!httpServer) return yield* Effect.die(new Error("HTTP server not started"));
						const addr = httpServer.address();
						if (!addr || typeof addr === "string") return yield* Effect.die(new Error("Unexpected address format"));
						return addr.address;
					}),
			} satisfies HttpListenerShape;
		}),
	);
