import { McpServer } from "@modelcontextprotocol/server";
import { SERVER_NAME, SERVER_VERSION } from "../../config/mcp-server/mcp-server.config.js";
import { registerCoffeeDomain } from "../../coffee/coffee.domain.js";

export function createMcpServer(): McpServer {
	const server = new McpServer({
		name: SERVER_NAME,
		version: SERVER_VERSION,
	});

	registerCoffeeDomain(server);

	return server;
}
