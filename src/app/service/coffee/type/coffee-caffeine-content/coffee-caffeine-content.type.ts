/**
 * Schema for the coffee entity's caffeine content.
 *
 * @remarks
 * Defines an integer schema constrained to the range 0–500,
 * used as the `caffeineMg` field in {@link CoffeeSchema}.  The
 * `arbitrary` annotation produces integers within the same bounds
 * for property-based testing.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * Effect {@link Schema} for a coffee's caffeine content in
 * milligrams.
 *
 * @remarks
 * Constrains the value to an integer between 0 and 500 (inclusive)
 * and attaches a `fast-check` arbitrary that generates values in
 * the same range.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeCaffeineContentSchema } from "./coffee-caffeine-content.type.js";
 *
 * const mg = Schema.decodeUnknownSync(CoffeeCaffeineContentSchema)(150);
 * ```
 */
export const CoffeeCaffeineContentSchema = Schema.Number.pipe(
	Schema.int(),
	Schema.between(0, 500),
).annotations({
	arbitrary: () => (fc) => fc.integer({ min: 0, max: 500 }),
});

/**
 * A coffee's caffeine content in milligrams (integer, 0–500).
 *
 * @remarks
 * Derived from {@link CoffeeCaffeineContentSchema} via `typeof CoffeeCaffeineContentSchema.Type`.
 */
export type CoffeeCaffeineContent = typeof CoffeeCaffeineContentSchema.Type;
