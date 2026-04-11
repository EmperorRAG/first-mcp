import type { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "./shared/repository/coffee.repository.js";
import { registerGetCoffeesModule } from "./get-coffees/module/get-coffees.module.js";
import { registerGetACoffeeModule } from "./get-a-coffee/module/get-a-coffee.module.js";

export function registerCoffeeDomain(server: McpServer): void {
	const repo = new InMemoryCoffeeRepository();
	registerGetCoffeesModule(server, repo);
	registerGetACoffeeModule(server, repo);
}
