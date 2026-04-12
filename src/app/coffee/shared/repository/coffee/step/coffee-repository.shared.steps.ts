/**
 * Shared BDD step definitions for the coffee repository component.
 * Provides repository initialization and data retrieval steps used by unit, integration, and contract features.
 *
 * @module
 */
import { Given, When, type QuickPickleWorldInterface } from "quickpickle";
import { InMemoryCoffeeRepository } from "../coffee.repository.js";
import type { Coffee } from "../../../type/coffee.types.js";
import type { CoffeeRepository } from "../coffee.repository.js";

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
