/**
 * Shared types for the MCP server session manager.
 *
 * @remarks
 * Centralises the {@link McpServerServiceShape} service contract and
 * the {@link SessionEntry} type so that consumers can depend on the
 * shape without pulling in the full implementation from
 * `mcp-server.ts`.
 *
 * @module
 */
import type { McpServer } from "@modelcontextprotocol/server";
import type { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import type { StdioServerTransport } from "@modelcontextprotocol/server";
import type { Effect } from "effect";
import type { SessionNotFoundError } from "./errors.js";

/**
 * Maps an MCP session identifier to its SDK transport and server
 * instances.
 *
 * @remarks
 * Each session — whether HTTP (per-request) or stdio (single
 * instance) — is tracked as a `SessionEntry`.  The `server` property
 * holds the {@link McpServer} that processes MCP protocol messages;
 * the `sdkTransport` holds the SDK-level transport that bridges
 * the MCP protocol to the wire format.
 */
export interface SessionEntry {
	readonly server: McpServer;
	readonly sdkTransport: NodeStreamableHTTPServerTransport | StdioServerTransport;
}

/**
 * Service contract for the MCP server session manager.
 *
 * @remarks
 * The session manager owns the lifecycle of all MCP sessions.  It
 * creates {@link McpServer} instances, registers domain tools, and
 * manages the session map.  Transport and routing concerns are
 * delegated to the listener services (`HttpListener`, `StdioListener`)
 * that depend on this service.
 *
 * | Method | Purpose |
 * |--------|---------|
 * | {@link start} | Initialises internal state (no-op if already ready) |
 * | {@link stop} | Closes all active sessions and clears the map |
 * | {@link getSession} | Retrieves a session by ID |
 * | {@link setSession} | Creates a new session and returns the SDK-assigned ID |
 * | {@link deleteSession} | Closes and removes a session by ID |
 */
export interface McpServerServiceShape {
	/**
	 * Initialises the session manager.
	 *
	 * @returns An {@link Effect.Effect} that resolves once
	 *          initialisation is complete.
	 */
	readonly start: () => Effect.Effect<void>;

	/**
	 * Closes all active sessions and clears the session map.
	 *
	 * @returns An {@link Effect.Effect} that resolves once all
	 *          sessions are closed.
	 */
	readonly stop: () => Effect.Effect<void>;

	/**
	 * Retrieves a session entry by its identifier.
	 *
	 * @param sessionId - The MCP session identifier to look up.
	 * @returns An {@link Effect.Effect} yielding the
	 *          {@link SessionEntry}, or failing with
	 *          {@link SessionNotFoundError} if not found.
	 */
	readonly getSession: (sessionId: string) => Effect.Effect<SessionEntry, SessionNotFoundError>;

	/**
	 * Creates a new MCP session (server + SDK transport), registers
	 * domain tools, connects, and stores the session.
	 *
	 * @remarks
	 * The session ID is determined internally:
	 * - **HTTP mode**: the SDK transport fires
	 *   `onsessioninitialized(id)` — that ID keys the map.
	 * - **stdio mode**: uses the fixed key `"stdio"`.
	 *
	 * @returns An {@link Effect.Effect} yielding the session ID
	 *          string.
	 */
	readonly setSession: () => Effect.Effect<string>;

	/**
	 * Closes and removes a session by its identifier.
	 *
	 * @param sessionId - The MCP session identifier to remove.
	 * @returns An {@link Effect.Effect} that resolves once the
	 *          session is closed and removed.
	 */
	readonly deleteSession: (sessionId: string) => Effect.Effect<void>;
}
