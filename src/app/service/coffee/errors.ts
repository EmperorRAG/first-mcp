/**
 * Tagged error types for the coffee domain.
 *
 * @remarks
 * Each error extends {@link Data.TaggedError}, which adds a discriminant
 * `_tag` property to the `Error` subclass.  This enables exhaustive
 * pattern matching via {@link Effect.catchTag} in service and controller
 * layers without resorting to `instanceof` checks.
 *
 * @module
 */
import { Data } from "effect";

/**
 * Error raised when a requested coffee drink cannot be found by name.
 *
 * @remarks
 * Extends {@link Data.TaggedError} with the discriminant
 * `_tag = "CoffeeNotFoundError"`.  The `coffeeName` field carries the
 * lookup key that failed, enabling callers to include it in user-facing
 * error messages.
 *
 * The field is named `coffeeName` (not `name`) to avoid shadowing the
 * inherited `Error.name` property.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { CoffeeNotFoundError } from "./errors.js";
 *
 * const program = Effect.fail(
 *   new CoffeeNotFoundError({ coffeeName: "Mocha" }),
 * ).pipe(
 *   Effect.catchTag("CoffeeNotFoundError", (e) =>
 *     Effect.succeed(`Not found: ${e.coffeeName}`),
 *   ),
 * );
 * ```
 */
export class CoffeeNotFoundError extends Data.TaggedError(
	"CoffeeNotFoundError",
)<{ readonly coffeeName: string }> { }
