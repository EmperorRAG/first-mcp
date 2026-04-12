/**
 * Contract BDD step definitions for the coffee repository component.
 * Covers Coffee interface property type and count conformance assertions.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { getObjectProperty } from "../../../../../testing/utility/reflect.utility.js";

Then(
	"each coffee should have an/a {string} property of type {string}",
	(world: QuickPickleWorldInterface, prop: string, type: string) => {
		for (const coffee of world.coffees) {
			expect(coffee).toHaveProperty(prop);
			expect(typeof getObjectProperty(coffee, prop)).toBe(
				type,
			);
		}
	},
);

Then(
	"each coffee should have exactly {int} properties",
	(world: QuickPickleWorldInterface, count: number) => {
		for (const coffee of world.coffees) {
			expect(Object.keys(coffee)).toHaveLength(count);
		}
	},
);
