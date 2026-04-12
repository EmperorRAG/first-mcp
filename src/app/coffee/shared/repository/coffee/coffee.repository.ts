/**
 * Coffee repository interface and in-memory implementation for data access.
 *
 * @module
 */
import type { Coffee } from "../../type/coffee.types.js";

/**
 * Data access contract for coffee drink persistence.
 *
 * @remarks
 * Defines the read operations available for the coffee catalog.
 * Implementations may use in-memory storage, databases, or external APIs.
 *
 * @see {@link InMemoryCoffeeRepository} for the default implementation.
 */
export interface CoffeeRepository {
	/** Retrieves all coffee drinks in the catalog. */
	findAll(): Coffee[];

	/**
	 * Finds a coffee drink by its exact name.
	 *
	 * @param name - The exact display name of the coffee drink.
	 * @returns The matching coffee, or `undefined` if not found.
	 */
	findByName(name: string): Coffee | undefined;
}

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
 *
 * @see {@link CoffeeRepository} for the interface contract.
 */
export class InMemoryCoffeeRepository implements CoffeeRepository {
	/**
	 * Returns all coffee drinks in the in-memory catalog.
	 *
	 * @returns An array of all available coffee drinks.
	 */
	findAll(): Coffee[] {
		return coffeeDrinks;
	}

	/**
	 * Finds a coffee drink by its exact name.
	 *
	 * @param name - The exact display name to search for.
	 * @returns The matching coffee, or `undefined` if no match is found.
	 */
	findByName(name: string): Coffee | undefined {
		return coffeeDrinks.find((c) => c.name === name);
	}
}
