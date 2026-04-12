/**
 * Integration BDD step definitions for the get-a-coffee service module.
 * Covers single coffee lookup, response text, price, and not-found assertions.
 *
 * @module
 */
import { When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { parseCoffeeJson } from "../../../testing/utility/coffee-parser.utility.js";

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
