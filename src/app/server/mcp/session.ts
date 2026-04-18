/**
 * HTTP session management — tracks active MCP sessions and handles
 * MCP messages, SSE requests, and session termination.
 *
 * @remarks
 * Manages a per-server session map where each entry associates a
 * session ID (UUID) with an {@link McpServer} and its
 * {@link NodeStreamableHTTPServerTransport}.  Three handler functions
 * are exported:
 *
 * | Handler | Trigger |
 * |---------|---------|
 * | {@link handleMcpMessage} | `POST /mcp` — initialize or forward |
 * | {@link handleMcpSse} | `GET /mcp` — SSE backward-compat |
 * | {@link handleSessionTerminate} | `DELETE /mcp` — close session |
 *
 * All handlers accept their dependencies as parameters (no closures)
 * for testability.
 *
 * @module
 */
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { Effect, type ManagedRuntime, Ref } from "effect";
import type { TransportShape } from "../../transport/transport.js";
import type { McpRequest } from "../../transport/mcp-request.js";
import { McpResponse } from "../../transport/mcp-response.js";

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
 */
export interface SessionEntry {
	readonly server: McpServer;
	readonly sdkTransport: NodeStreamableHTTPServerTransport;
}

/**
 * Handles a routed MCP message in HTTP mode.
 *
 * @remarks
 * Three outcomes:
 *
 * 1. **Existing session** — `mcpReq.sessionId` matches a map entry;
 *    delegates to `transport.handleMcp` with the stored SDK transport.
 * 2. **New session** — no session ID and `mcpReq.isInitialize` is
 *    `true`; creates a new {@link NodeStreamableHTTPServerTransport},
 *    connects an {@link McpServer}, and stores the pair in the session
 *    map.
 * 3. **Invalid** — responds with HTTP 400.
 *
 * @param mcpReq - The parsed {@link McpRequest}.
 * @param sessionsRef - Effect {@link Ref} holding the session map.
 * @param runtime - {@link ManagedRuntime} for tool handler resolution.
 * @param transport - The resolved {@link TransportShape} for wire I/O.
 * @param createMcpServerFn - Factory that creates and configures an
 *        {@link McpServer} with registered tools.
 * @returns An {@link Effect.Effect} that resolves once the message is
 *          handled.
 */
export const handleMcpMessage = (
	mcpReq: McpRequest,
	sessionsRef: Ref.Ref<Map<string, SessionEntry>>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
	transport: TransportShape,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createMcpServerFn: (runtime: ManagedRuntime.ManagedRuntime<any, unknown>) => McpServer,
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

			const server = createMcpServerFn(runtime);
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
 * @remarks
 * Looks up the session by `mcpReq.sessionId`.  If found, delegates
 * to `transport.handleMcp` for SSE backward-compatibility streaming.
 * Otherwise responds with HTTP 400.
 *
 * @param mcpReq - The parsed {@link McpRequest}.
 * @param sessionsRef - Effect {@link Ref} holding the session map.
 * @param transport - The resolved {@link TransportShape} for wire I/O.
 * @returns An {@link Effect.Effect} that resolves once the SSE request
 *          is handled.
 */
export const handleMcpSse = (
	mcpReq: McpRequest,
	sessionsRef: Ref.Ref<Map<string, SessionEntry>>,
	transport: TransportShape,
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
 * @remarks
 * Looks up the session by `mcpReq.sessionId`.  If found, closes the
 * SDK transport, removes the session from the map, and responds with
 * HTTP 200.  Otherwise responds with HTTP 400.
 *
 * @param mcpReq - The parsed {@link McpRequest}.
 * @param sessionsRef - Effect {@link Ref} holding the session map.
 * @param transport - The resolved {@link TransportShape} for wire I/O.
 * @returns An {@link Effect.Effect} that resolves once the session is
 *          terminated or an error response is sent.
 */
export const handleSessionTerminate = (
	mcpReq: McpRequest,
	sessionsRef: Ref.Ref<Map<string, SessionEntry>>,
	transport: TransportShape,
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
