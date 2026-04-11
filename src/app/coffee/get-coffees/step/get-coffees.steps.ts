import { Given, When, Then } from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "../../shared/repository/coffee.repository.js";
import { registerGetCoffeesModule } from "../module/get-coffees.module.js";
import { GetCoffeesService } from "../service/get-coffees.service.js";
import { GetCoffeesController } from "../controller/get-coffees.controller.js";
import type { ToolTextResponse } from "../../../../common/types/tool-response.js";
import type { Coffee } from "../../shared/coffee.types.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		server: McpServer;
		getCoffeesController: GetCoffeesController;
		toolResponse: ToolTextResponse;
		parsedCoffees: Coffee[];
	}
}

Given("the get-coffees module is registered", (world) => {
	const repo = new InMemoryCoffeeRepository();
	const service = new GetCoffeesService(repo);
	world.getCoffeesController = new GetCoffeesController(service);
	world.server = new McpServer({ name: "test", version: "0.0.0" });
	registerGetCoffeesModule(world.server, repo);
});

When("I call the {string} tool", (world, toolName: string) => {
	expect(toolName).toBe("get-coffees");
	world.toolResponse = world.getCoffeesController.handle();
	const text = world.toolResponse.content[0].text;
	world.parsedCoffees = JSON.parse(text) as Coffee[];
});

Then(
	"the response should contain {int} coffees",
	(world, count: number) => {
		expect(world.parsedCoffees).toHaveLength(count);
	},
);

Then(
	"the response should include a coffee named {string}",
	(world, name: string) => {
		const found = world.parsedCoffees.find((c) => c.name === name);
		expect(found).toBeDefined();
	},
);

// Contract steps

Then("the response should have a {string} array", (world, prop: string) => {
	expect(world.toolResponse).toHaveProperty(prop);
	expect(Array.isArray((world.toolResponse as Record<string, unknown>)[prop])).toBe(true);
});

Then("the first content item should have type {string}", (world, type: string) => {
	expect(world.toolResponse.content[0].type).toBe(type);
});

Then("the first content item text should be valid JSON", (world) => {
	expect(() => JSON.parse(world.toolResponse.content[0].text)).not.toThrow();
});

Then(
	"each coffee in the response should conform to the Coffee interface",
	(world) => {
		const coffeeKeys = ["id", "name", "size", "price", "iced", "caffeineMg"];
		for (const coffee of world.parsedCoffees) {
			for (const key of coffeeKeys) {
				expect(coffee).toHaveProperty(key);
			}
		}
	},
);
