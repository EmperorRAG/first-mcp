/**
 * Schema for the coffee entity's price.
 *
 * @remarks
 * Defines a positive-number schema used as the `price` field in
 * {@link CoffeeSchema}.  The `arbitrary` annotation delegates to
 * {@link https://www.npmjs.com/package/@faker-js/faker | @faker-js/faker}'s
 * `commerce.price()` for realistic USD values between $1 and $15.
 *
 * @module
 */
import { Schema } from "effect";
import { faker } from "@faker-js/faker";

/**
 * Effect {@link Schema} for a coffee's price in US dollars.
 *
 * @remarks
 * Constrains the value to a positive number and attaches a
 * Faker-powered `fast-check` arbitrary that produces prices in the
 * range $1–$15.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeePriceSchema } from "./coffee-price.type.js";
 *
 * const price = Schema.decodeUnknownSync(CoffeePriceSchema)(5.25);
 * ```
 */
export const CoffeePriceSchema = Schema.Number.pipe(
	Schema.positive(),
).annotations({
	arbitrary: () => (fc) =>
		fc
			.constant(null)
			.map(() => parseFloat(faker.commerce.price({ min: 1, max: 15 }))),
});

/**
 * A coffee's price in US dollars (positive number).
 *
 * @remarks
 * Derived from {@link CoffeePriceSchema} via `typeof CoffeePriceSchema.Type`.
 */
export type CoffeePrice = typeof CoffeePriceSchema.Type;
