/**
 * MCP server factory — creates and configures an {@link McpServer}
 * instance with auto-registered domain tools.
 *
 * @remarks
 * Extracts the `McpServer` construction and tool registration logic
 * into a standalone function so that both HTTP (per-session) and stdio
 * (single-instance) lifecycles can share the same creation path.
 *
 * | Export | Purpose |
 * |--------|---------|
 * | {@link createMcpServer} | Builds an {@link McpServer} with active tools registered |
 *
 * @module
 */
import { McpServer } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";
import { CoffeeDomain, registerCoffeeTools } from "../../service/coffee/domain.js";
import type { ActiveToolsRecord } from "./registerable-tool.js";

/**
 * Creates a new {@link McpServer} and registers active domain tools.
 *
 * @remarks
 * Constructs the server with the provided `name` and `version`, then
 * delegates to {@link registerCoffeeTools} which iterates the
 * {@link CoffeeDomain} properties and registers only those whose
 * `metaData.name` appears in the {@link ActiveToolsRecord}.
 *
 * @param config - Server identity (`name`, `version`).
 * @param domain - The resolved {@link CoffeeDomain} service instance.
 * @param activeTools - Tool-name → enabled lookup.
 * @param runtime - A {@link ManagedRuntime} providing
 *   {@link CoffeeDomain} for tool handler execution.
 * @returns A fully configured {@link McpServer} ready for transport
 *   connection.
 *
 * @internal
 */
export function createMcpServer(
	config: { readonly name: string; readonly version: string },
	domain: CoffeeDomain,
	activeTools: ActiveToolsRecord,
	runtime: ManagedRuntime.ManagedRuntime<CoffeeDomain, unknown>,
): McpServer {
	const server = new McpServer({
		name: config.name,
		version: config.version,
	});
	registerCoffeeTools(domain, server, activeTools, runtime);
	return server;
}
