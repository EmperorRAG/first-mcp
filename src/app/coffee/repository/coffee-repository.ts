/**
 * Coffee repository — Effect Context.Tag and in-memory implementation.
 *
 * @module
 */
import { Context, Effect, Layer } from "effect";
import type { Coffee } from "../types.js";

/**
 * Data access contract for coffee drink persistence.
 *
 * @remarks
 * Each method returns an `Effect` for consistency and future async/DB readiness.
 */
export interface CoffeeRepositoryShape {
	readonly findAll: Effect.Effect<Coffee[]>;
	readonly findByName: (name: string) => Effect.Effect<Coffee | undefined>;
}

/**
 * Context tag for the coffee repository service.
 */
export class CoffeeRepository extends Context.Tag("CoffeeRepository")<
	CoffeeRepository,
	CoffeeRepositoryShape
>() { }

const coffeeDrinks: Coffee[] = [
	{
		id: 1,
		name: "Flat White",
		size: "Medium",
		price: 4.5,
		iced: false,
		caffeineMg: 130,
	},
	{
		id: 2,
		name: "Cappuccino",
		size: "Small",
		price: 3.75,
		iced: false,
		caffeineMg: 80,
	},
	{
		id: 3,
		name: "Latte",
		size: "Large",
		price: 5.25,
		iced: true,
		caffeineMg: 150,
	},
	{
		id: 4,
		name: "Espresso",
		size: "Small",
		price: 2.5,
		iced: false,
		caffeineMg: 64,
	},
];

/**
 * In-memory implementation of the coffee repository.
 *
 * @remarks
 * Stores a fixed catalog of coffee drinks in a local array.
 * Suitable for development, testing, and demo purposes.
 */
export const InMemoryCoffeeRepository = Layer.succeed(CoffeeRepository, {
	findAll: Effect.sync(() => coffeeDrinks),
	findByName: (name: string) =>
		Effect.sync(() => coffeeDrinks.find((c) => c.name === name)),
});
