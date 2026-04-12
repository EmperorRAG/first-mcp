/**
 * Shared BDD step definitions for the get-coffees service module.
 * Provides module registration setup used by both integration and contract features.
 *
 * @module
 */
import { Given, type QuickPickleWorldInterface } from "quickpickle";
import { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { registerGetCoffeesModule } from "../module/get-coffees.module.js";
import { GetCoffeesService } from "../service/get-coffees.service.js";
import { GetCoffeesController } from "../controller/get-coffees.controller.js";
import type { ToolTextResponse } from "../../../type/tool-response/tool-response.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		server: McpServer;
		getCoffeesController: GetCoffeesController;
		toolResponse: ToolTextResponse;
		parsedCoffees: Coffee[];
	}
}

Given("the get-coffees module is registered", (world: QuickPickleWorldInterface) => {
	const repo = new InMemoryCoffeeRepository();
	const service = new GetCoffeesService(repo);
	world.getCoffeesController = new GetCoffeesController(service);
	world.server = new McpServer({ name: "test", version: "0.0.0" });
	registerGetCoffeesModule(world.server, repo);
});
