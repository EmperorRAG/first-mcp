/**
 * Stdio transport — connects an McpServer to `StdioServerTransport` for local VS Code integration.
 *
 * @module
 */
import type { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server";

/**
 * Starts the stdio transport for local MCP integration.
 *
 * @param server - The configured MCP server instance to connect.
 *
 * @remarks
 * Uses `StdioServerTransport` for local communication, typically
 * invoked when the `--stdio` flag is passed. Designed for VS Code MCP
 * client integration via `.vscode/mcp.json`.
 *
 * @example
 * ```ts
 * const server = createMcpServer(config);
 * await startStdioServer(server);
 * ```
 */
export async function startStdioServer(server: McpServer): Promise<void> {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("MCP Server running on stdio");
}
