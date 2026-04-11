import { McpServer } from "@modelcontextprotocol/server";
import { SERVER_NAME, SERVER_VERSION } from "./config/server.config.js";
import { registerCoffeeDomain } from "./app/coffee/coffee.domain.js";

export function createServer(): McpServer {
	const server = new McpServer({
		name: SERVER_NAME,
		version: SERVER_VERSION,
	});

	registerCoffeeDomain(server);

	return server;
}
