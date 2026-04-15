/**
 * Pre-built {@link Coffee} entity fixtures and a factory function
 * for creating test data.
 *
 * @remarks
 * Provides two individual fixtures ({@link flatWhiteCoffee},
 * {@link espressoCoffee}), a pre-assembled list
 * ({@link defaultCoffeeList}), and a partial-override factory
 * ({@link createCoffee}).  {@link defaultCoffeeList} and
 * {@link createCoffee} are deprecated—see their individual doc
 * comments for migration guidance.
 *
 * @module
 */
import type { Coffee } from "../../service/coffee/type/coffee/coffee.type.js";

/**
 * Pre-built flat white {@link Coffee} fixture.
 *
 * @remarks
 * Represents a medium-sized, hot flat white with 130 mg caffeine.
 * Used as the base object for {@link createCoffee} overrides and as
 * the first entry in {@link defaultCoffeeList}.
 */
export const flatWhiteCoffee: Coffee = {
	id: 1,
	name: "Flat White",
	size: "Medium",
	price: 4.5,
	iced: false,
	caffeineMg: 130,
};

/**
 * Pre-built espresso {@link Coffee} fixture.
 *
 * @remarks
 * Represents a small, hot espresso with 64 mg caffeine.  Used as
 * the second entry in {@link defaultCoffeeList}.
 */
export const espressoCoffee: Coffee = {
	id: 2,
	name: "Espresso",
	size: "Small",
	price: 2.5,
	iced: false,
	caffeineMg: 64,
};

/**
 * Default list of {@link Coffee} fixtures used by mock repositories.
 *
 * @deprecated No longer imported by any test.  The Effect-TS
 * migration uses `InMemoryCoffeeRepository` with its own
 * built-in seed data.  Use individual fixtures
 * ({@link flatWhiteCoffee}, {@link espressoCoffee}) when specific
 * entities are needed.
 *
 * @remarks
 * Contains {@link flatWhiteCoffee} and {@link espressoCoffee} in
 * insertion order.
 */
export const defaultCoffeeList: Coffee[] = [flatWhiteCoffee, espressoCoffee];

/**
 * Creates a {@link Coffee} entity with optional property overrides.
 *
 * @deprecated No longer imported by any test.  Use object spread
 * with {@link flatWhiteCoffee} directly:
 * `{ ...flatWhiteCoffee, name: "Custom" }`.
 *
 * @remarks
 * Uses {@link flatWhiteCoffee} as the base and merges the provided
 * overrides via object spread.
 *
 * @param overrides - Partial {@link Coffee} properties to override
 *   defaults.
 * @returns A complete {@link Coffee} entity.
 */
export function createCoffee(overrides: Partial<Coffee> = {}): Coffee {
	return {
		...flatWhiteCoffee,
		...overrides,
	};
}