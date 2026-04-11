import {
	Given,
	When,
	Then,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { InMemoryCoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { registerGetCoffeesModule } from "../module/get-coffees.module.js";
import { GetCoffeesService } from "../service/get-coffees.service.js";
import { GetCoffeesController } from "../controller/get-coffees.controller.js";
import type { ToolTextResponse } from "../../../common/type/tool-response/tool-response.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		server: McpServer;
		getCoffeesController: GetCoffeesController;
		toolResponse: ToolTextResponse;
		parsedCoffees: Coffee[];
	}
}

function getObjectProperty(value: unknown, key: string): unknown {
	if (typeof value !== "object" || value === null) {
		return undefined;
	}
	return Reflect.get(value, key);
}

function isCoffee(value: unknown): value is Coffee {
	return (
		typeof getObjectProperty(value, "id") === "number"
		&& typeof getObjectProperty(value, "name") === "string"
		&& typeof getObjectProperty(value, "size") === "string"
		&& typeof getObjectProperty(value, "price") === "number"
		&& typeof getObjectProperty(value, "iced") === "boolean"
		&& typeof getObjectProperty(value, "caffeineMg") === "number"
	);
}

function parseCoffeeArrayJson(text: string): Coffee[] {
	const parsed: unknown = JSON.parse(text);
	if (!Array.isArray(parsed) || !parsed.every(isCoffee)) {
		throw new Error("Expected tool output to conform to Coffee[] interface");
	}
	return parsed;
}

Given("the get-coffees module is registered", (world: QuickPickleWorldInterface) => {
	const repo = new InMemoryCoffeeRepository();
	const service = new GetCoffeesService(repo);
	world.getCoffeesController = new GetCoffeesController(service);
	world.server = new McpServer({ name: "test", version: "0.0.0" });
	registerGetCoffeesModule(world.server, repo);
});

When("I call the {string} tool", (world: QuickPickleWorldInterface, toolName: string) => {
	expect(toolName).toBe("get-coffees");
	world.toolResponse = world.getCoffeesController.handle();
	const text = world.toolResponse.content[0].text;
	world.parsedCoffees = parseCoffeeArrayJson(text);
});

Then(
	"the response should contain {int} coffees",
	(world: QuickPickleWorldInterface, count: number) => {
		expect(world.parsedCoffees).toHaveLength(count);
	},
);

Then(
	"the response should include a coffee named {string}",
	(world: QuickPickleWorldInterface, name: string) => {
		const found = world.parsedCoffees.find((c) => c.name === name);
		expect(found).toBeDefined();
	},
);

// Contract steps

Then("the response should have a {string} array", (world: QuickPickleWorldInterface, prop: string) => {
	expect(world.toolResponse).toHaveProperty(prop);
	expect(Array.isArray(world.toolResponse[prop])).toBe(true);
});

Then("the first content item should have type {string}", (world: QuickPickleWorldInterface, type: string) => {
	expect(world.toolResponse.content[0].type).toBe(type);
});

Then("the first content item text should be valid JSON", (world: QuickPickleWorldInterface) => {
	expect(() => JSON.parse(world.toolResponse.content[0].text)).not.toThrow();
});

Then(
	"each coffee in the response should conform to the Coffee interface",
	(world: QuickPickleWorldInterface) => {
		const coffeeKeys = ["id", "name", "size", "price", "iced", "caffeineMg"];
		for (const coffee of world.parsedCoffees) {
			for (const key of coffeeKeys) {
				expect(coffee).toHaveProperty(key);
			}
		}
	},
);
