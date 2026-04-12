/**
 * Contract BDD step definitions for the get-coffees service module.
 * Covers response shape, content type, JSON validity, and Coffee interface conformance.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";

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
