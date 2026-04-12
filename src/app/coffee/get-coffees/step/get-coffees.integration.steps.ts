/**
 * Integration BDD step definitions for the get-coffees service module.
 * Covers tool invocation, coffee count, and name presence assertions.
 *
 * @module
 */
import { When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { parseCoffeeArrayJson } from "../../../testing/utility/coffee-parser.utility.js";

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
