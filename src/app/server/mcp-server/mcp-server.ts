/**
 * Factory for creating an McpServer instance with all domains registered.
 *
 * @module
 */
import { McpServer } from "@modelcontextprotocol/server";
import type { ServerConfig } from "../../config/mcp-server/mcp-server.config.js";
import { registerCoffeeDomain } from "../../coffee/coffee.domain.js";

/**
 * Creates and configures a new MCP server instance.
 *
 * @param config - Server identity and network configuration.
 * @returns A fully configured `McpServer` with all domains registered.
 *
 * @remarks
 * Instantiates the MCP server with the provided name and version, then
 * registers all domain tool modules. Currently registers the coffee domain
 * via {@link registerCoffeeDomain}.
 *
 * @example
 * ```ts
 * const config = createServerConfig();
 * const server = createMcpServer(config);
 * ```
 */
export function createMcpServer(config: ServerConfig): McpServer {
	const server = new McpServer({
		name: config.name,
		version: config.version,
	});

	registerCoffeeDomain(server);

	return server;
}
