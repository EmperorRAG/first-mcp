/**
 * Stdio transport — connects an {@link McpServer} to a
 * {@link StdioServerTransport} for local VS Code MCP integration.
 *
 * @remarks
 * When the application is launched with the `--stdio` CLI flag, this
 * module is used instead of the HTTP transport.  Communication flows
 * over `process.stdin` (incoming JSON-RPC) and `process.stdout`
 * (outgoing JSON-RPC), making it suitable for editor extensions that
 * spawn the server as a child process.  The canonical client
 * configuration lives in `.vscode/mcp.json`.
 *
 * Because stdio is inherently single-session, no session map or
 * transport cleanup logic is required — the process lifecycle manages
 * the connection.
 *
 * @module
 */
import type { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server";
import { Effect } from "effect";

/**
 * Connects an {@link McpServer} to a {@link StdioServerTransport} and
 * begins listening for JSON-RPC messages on `process.stdin`, writing
 * responses to `process.stdout`.
 *
 * @remarks
 * This transport is activated when the application is launched with the
 * `--stdio` CLI flag (see `main.ts`).  It is the primary integration
 * path for local VS Code MCP clients configured via `.vscode/mcp.json`.
 *
 * Internally the function:
 *
 * 1. Instantiates a {@link StdioServerTransport} — the MCP SDK class
 *    that reads newline-delimited JSON-RPC from `stdin` and writes
 *    responses to `stdout`.
 * 2. Connects the provided {@link McpServer} to the transport via
 *    {@link McpServer.connect}, which begins the bidirectional message
 *    loop.
 * 3. Logs a confirmation message via {@link Effect.logInfo}.
 *
 * Because stdio is inherently single-session (one `stdin`/`stdout` pair),
 * no session map or transport cleanup is required — the process lifecycle
 * manages the connection.
 *
 * @param server - A fully-configured {@link McpServer} instance with all
 *        domains and tools already registered.
 * @returns An {@link Effect.Effect} that resolves once the transport is
 *          connected and the server is ready to receive messages.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { startStdioServer } from "./stdio.js";
 *
 * const server = createMcpServer();
 * await Effect.runPromise(startStdioServer(server));
 * ```
 */
export const startStdioServer = (server: McpServer): Effect.Effect<void> =>
	Effect.gen(function* () {
		const transport = new StdioServerTransport();
		yield* Effect.promise(() => server.connect(transport));
		yield* Effect.logInfo("MCP Server running on stdio");
	});
