import type { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "./shared/repository/coffee/coffee.repository.js";
import { registerGetCoffeesModule } from "./get-coffees/module/get-coffees.module.js";
import { registerGetACoffeeModule } from "./get-a-coffee/module/get-a-coffee.module.js";

/**
 * Registers all coffee domain tool modules on the MCP server.
 *
 * @param server - The MCP server to register tools on.
 *
 * @remarks
 * Creates a shared {@link InMemoryCoffeeRepository} and wires it into
 * the get-coffees and get-a-coffee module-service chains via
 * {@link registerGetCoffeesModule} and {@link registerGetACoffeeModule}.
 */
export function registerCoffeeDomain(server: McpServer): void {
	const repo = new InMemoryCoffeeRepository();
	registerGetCoffeesModule(server, repo);
	registerGetACoffeeModule(server, repo);
}
