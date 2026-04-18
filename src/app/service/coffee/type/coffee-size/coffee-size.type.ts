/**
 * Schema for the coffee entity's cup size.
 *
 * @remarks
 * Defines a literal union schema (`"Small"`, `"Medium"`, `"Large"`)
 * used as the `size` field in {@link CoffeeSchema}.  The `arbitrary`
 * annotation draws uniformly from the three allowed values.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * Effect {@link Schema} for a coffee's cup size.
 *
 * @remarks
 * Restricts the value to the literal union
 * `"Small" | "Medium" | "Large"` and attaches a `fast-check`
 * arbitrary that selects uniformly among the three options.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeSizeSchema } from "./coffee-size.type.js";
 *
 * const size = Schema.decodeUnknownSync(CoffeeSizeSchema)("Medium");
 * ```
 */
export const CoffeeSizeSchema = Schema.Literal(
	"Small",
	"Medium",
	"Large",
).annotations({
	arbitrary: () => (fc) => fc.constantFrom("Small", "Medium", "Large"),
});

/**
 * A coffee's cup size — `"Small"`, `"Medium"`, or `"Large"`.
 *
 * @remarks
 * Derived from {@link CoffeeSizeSchema} via `typeof CoffeeSizeSchema.Type`.
 */
export type CoffeeSize = typeof CoffeeSizeSchema.Type;
