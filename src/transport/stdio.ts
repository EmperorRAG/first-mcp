import type { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server";

export async function startStdioServer(server: McpServer): Promise<void> {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("MCP Server running on stdio");
}
