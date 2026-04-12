/**
 * Unit BDD step definitions for the coffee repository component.
 * Covers `findByName` lookups and exact count, name, and price assertions.
 *
 * @module
 */
import { When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";

When("I search for {string}", (world: QuickPickleWorldInterface, name: string) => {
	world.coffee = world.repo.findByName(name);
});

Then("I should receive {int} coffee items", (world: QuickPickleWorldInterface, count: number) => {
	expect(world.coffees).toHaveLength(count);
});

Then(
	"I should receive a coffee named {string}",
	(world: QuickPickleWorldInterface, name: string) => {
		expect(world.coffee).toBeDefined();
		expect(world.coffee!.name).toBe(name);
	},
);

Then("the coffee price should be {float}", (world: QuickPickleWorldInterface, price: number) => {
	expect(world.coffee!.price).toBe(price);
});

Then("I should receive no coffee", (world: QuickPickleWorldInterface) => {
	expect(world.coffee).toBeUndefined();
});
