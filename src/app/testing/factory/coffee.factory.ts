/**
 * Pre-built Coffee entity fixtures and factory for test data.
 *
 * @module
 */
import type { Coffee } from "../../coffee/shared/type/coffee.types.js";

/** Pre-built flat white Coffee fixture for unit and integration tests. */
export const flatWhiteCoffee: Coffee = {
	id: 1,
	name: "Flat White",
	size: "Medium",
	price: 4.5,
	iced: false,
	caffeineMg: 130,
};

/** Pre-built espresso Coffee fixture for unit and integration tests. */
export const espressoCoffee: Coffee = {
	id: 2,
	name: "Espresso",
	size: "Small",
	price: 2.5,
	iced: false,
	caffeineMg: 64,
};

/** Default list of Coffee fixtures used by mock repositories. */
export const defaultCoffeeList: Coffee[] = [flatWhiteCoffee, espressoCoffee];

/**
 * Creates a Coffee entity with optional property overrides.
 *
 * @remarks
 * Uses {@link flatWhiteCoffee} as the base and merges the provided overrides.
 *
 * @param overrides - Partial Coffee properties to override defaults.
 * @returns A complete Coffee entity.
 */
export function createCoffee(overrides: Partial<Coffee> = {}): Coffee {
	return {
		...flatWhiteCoffee,
		...overrides,
	};
}