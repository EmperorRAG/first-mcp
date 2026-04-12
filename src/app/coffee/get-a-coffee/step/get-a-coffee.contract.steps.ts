/**
 * Contract BDD step definitions for the get-a-coffee service module.
 * Covers Coffee interface conformance and input schema validation.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { GetACoffeeInputSchema } from "../dto/get-a-coffee.dto.js";

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
