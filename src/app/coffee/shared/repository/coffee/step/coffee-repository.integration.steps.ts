/**
 * Integration BDD step definitions for the coffee repository component.
 * Covers cross-method consistency: findable by name, positive price, and non-negative caffeine.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";

Then("every coffee should be findable by its name", (world: QuickPickleWorldInterface) => {
	for (const coffee of world.coffees) {
		const found = world.repo.findByName(coffee.name);
		expect(found).toBeDefined();
		expect(found!.id).toBe(coffee.id);
	}
});

Then("every coffee should have a positive price", (world: QuickPickleWorldInterface) => {
	for (const coffee of world.coffees) {
		expect(coffee.price).toBeGreaterThan(0);
	}
});

Then("every coffee should have a non-negative caffeine value", (world: QuickPickleWorldInterface) => {
	for (const coffee of world.coffees) {
		expect(coffee.caffeineMg).toBeGreaterThanOrEqual(0);
	}
});
