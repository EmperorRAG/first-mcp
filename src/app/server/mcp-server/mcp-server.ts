import { McpServer } from "@modelcontextprotocol/server";
import type { ServerConfig } from "../../config/mcp-server/mcp-server.config.js";
import { registerCoffeeDomain } from "../../coffee/coffee.domain.js";

export function createMcpServer(config: ServerConfig): McpServer {
	const server = new McpServer({
		name: config.name,
		version: config.version,
	});

	registerCoffeeDomain(server);

	return server;
}
