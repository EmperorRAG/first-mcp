/**
 * BDD step definitions for the coffee repository component.
 * Covers unit, integration, and contract scenarios for `findAll` and `findByName`.
 *
 * @module
 */
import { Given, When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { InMemoryCoffeeRepository } from "../coffee.repository.js";
import type { Coffee } from "../../../type/coffee.types.js";
import type { CoffeeRepository } from "../coffee.repository.js";
import { getObjectProperty } from "../../../../../testing/utility/reflect.utility.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		repo: CoffeeRepository;
		coffees: Coffee[];
		coffee: Coffee | undefined;
	}
}

Given("the coffee repository is initialized", (world: QuickPickleWorldInterface) => {
	world.repo = new InMemoryCoffeeRepository();
});

When("I request all coffees", (world: QuickPickleWorldInterface) => {
	world.coffees = world.repo.findAll();
});

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

// Integration steps

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

// Contract steps

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
