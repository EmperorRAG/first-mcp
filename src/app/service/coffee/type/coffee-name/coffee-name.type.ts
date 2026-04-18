/**
 * Schema for the coffee entity's display name.
 *
 * @remarks
 * Defines a non-empty string schema used as the `name` field in
 * {@link CoffeeSchema}.  The `arbitrary` annotation delegates to
 * {@link https://www.npmjs.com/package/@faker-js/faker | @faker-js/faker}'s
 * `commerce.productName()` for realistic test data.
 *
 * @module
 */
import { Schema } from "effect";
import { faker } from "@faker-js/faker";

/**
 * Effect {@link Schema} for a coffee's display name.
 *
 * @remarks
 * Constrains the value to a non-empty string and attaches a
 * Faker-powered `fast-check` arbitrary that produces realistic
 * product names.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeNameSchema } from "./coffee-name.type.js";
 *
 * const name = Schema.decodeUnknownSync(CoffeeNameSchema)("Flat White");
 * ```
 */
export const CoffeeNameSchema = Schema.NonEmptyString.annotations({
	arbitrary: () => (fc) =>
		fc.constant(null).map(() => faker.commerce.productName()),
});

/**
 * A coffee's display name (non-empty string).
 *
 * @remarks
 * Derived from {@link CoffeeNameSchema} via `typeof CoffeeNameSchema.Type`.
 */
export type CoffeeName = typeof CoffeeNameSchema.Type;
