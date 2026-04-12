import {
	Given,
	When,
	Then,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { registerGetACoffeeModule } from "../module/get-a-coffee.module.js";
import { GetACoffeeService } from "../service/get-a-coffee.service.js";
import { GetACoffeeController } from "../controller/get-a-coffee.controller.js";
import { GetACoffeeInputSchema } from "../dto/get-a-coffee.dto.js";
import type { ToolTextResponse } from "../../../type/tool-response/tool-response.js";
import type { Coffee } from "../../shared/type/coffee.types.js";
import { parseCoffeeJson } from "../../../testing/utility/coffee-parser.utility.js";

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

When(
	"I call the {string} tool with name {string}",
	(world: QuickPickleWorldInterface, toolName: string, name: string) => {
		expect(toolName).toBe("get-a-coffee");
		world.toolResponse = world.getACoffeeController.handle({ name });
		const text = world.toolResponse.content[0].text;
		if (text !== "Coffee not found") {
			world.parsedCoffee = parseCoffeeJson(text);
		} else {
			world.parsedCoffee = undefined;
		}
	},
);

Then(
	"the response text should contain {string}",
	(world: QuickPickleWorldInterface, expected: string) => {
		expect(world.toolResponse.content[0].text).toContain(expected);
	},
);

Then(
	"the response text should contain a price of {float}",
	(world: QuickPickleWorldInterface, price: number) => {
		expect(world.parsedCoffee).toBeDefined();
		expect(world.parsedCoffee!.price).toBe(price);
	},
);

Then("the response text should be {string}", (world: QuickPickleWorldInterface, expected: string) => {
	expect(world.toolResponse.content[0].text).toBe(expected);
});

// Contract steps — reuse some from get-coffees but scoped to get-a-coffee

Then(
	"the coffee in the response should conform to the Coffee interface",
	(world: QuickPickleWorldInterface) => {
		expect(world.parsedCoffee).toBeDefined();
		const coffeeKeys = [
			"id",
			"name",
			"size",
			"price",
			"iced",
			"caffeineMg",
		];
		for (const key of coffeeKeys) {
			expect(world.parsedCoffee).toHaveProperty(key);
		}
	},
);

Then(
	"the {string} tool should have an input schema requiring {string}",
	(_world: QuickPickleWorldInterface, _toolName: string, field: string) => {
		const schema = GetACoffeeInputSchema;
		const result = schema.safeParse({});
		expect(result.success).toBe(false);

		const validResult = schema.safeParse({ [field]: "test" });
		expect(validResult.success).toBe(true);
	},
);
