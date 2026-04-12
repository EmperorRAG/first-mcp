/**
 * Shared BDD step definitions for the get-a-coffee service module.
 * Provides module registration setup used by both integration and contract features.
 *
 * @module
 */
import { Given, type QuickPickleWorldInterface } from "quickpickle";
import { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { registerGetACoffeeModule } from "../module/get-a-coffee.module.js";
import { GetACoffeeService } from "../service/get-a-coffee.service.js";
import { GetACoffeeController } from "../controller/get-a-coffee.controller.js";
import type { ToolTextResponse } from "../../../type/tool-response/tool-response.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		server: McpServer;
		getACoffeeController: GetACoffeeController;
		toolResponse: ToolTextResponse;
		parsedCoffee: Coffee | undefined;
	}
}

Given(
	"the get-a-coffee module is registered",
	(world: QuickPickleWorldInterface) => {
		const repo = new InMemoryCoffeeRepository();
		const service = new GetACoffeeService(repo);
		world.getACoffeeController = new GetACoffeeController(service);
		world.server = new McpServer({ name: "test", version: "0.0.0" });
		registerGetACoffeeModule(world.server, repo);
	},
);
