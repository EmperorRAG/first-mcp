/**
 * Shared types for the MCP server orchestrator.
 *
 * @remarks
 * Centralises the {@link McpServerServiceShape} service contract so
 * that consumers can depend on the shape without pulling in the full
 * lifecycle implementation from `mcp-server.ts`.
 *
 * @module
 */
import type { Effect } from "effect";

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
	 *   request through the {@link Transport} layer, routes via the
	 *   {@link Router}, and dispatches to the appropriate handler.
	 *   Registers {@link Effect.addFinalizer} for graceful shutdown.
	 * - **stdio mode**: creates a single `McpServer` +
	 *   `StdioServerTransport` and connects them.
	 *
	 * @returns An {@link Effect.Effect} that resolves once the server
	 *          is listening (HTTP) or connected (stdio).
	 */
	readonly start: () => Effect.Effect<void>;
}
