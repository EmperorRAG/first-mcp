/**
 * Schema for the coffee entity's unique identifier.
 *
 * @remarks
 * Defines a positive-integer schema used as the `id` field in
 * {@link CoffeeSchema}.  The `arbitrary` annotation produces
 * values between 1 and 10 000 for property-based testing.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * Effect {@link Schema} for a coffee's unique identifier.
 *
 * @remarks
 * Constrains the value to a positive integer and attaches a
 * `fast-check` arbitrary that generates integers in the range
 * 1–10 000.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeIdSchema } from "./coffee-id.type.js";
 *
 * const id = Schema.decodeUnknownSync(CoffeeIdSchema)(42);
 * ```
 */
export const CoffeeIdSchema = Schema.Number.pipe(
	Schema.int(),
	Schema.positive(),
).annotations({
	arbitrary: () => (fc) => fc.integer({ min: 1, max: 10_000 }),
});

/**
 * A coffee's unique positive-integer identifier.
 *
 * @remarks
 * Derived from {@link CoffeeIdSchema} via `typeof CoffeeIdSchema.Type`.
 */
export type CoffeeId = typeof CoffeeIdSchema.Type;
