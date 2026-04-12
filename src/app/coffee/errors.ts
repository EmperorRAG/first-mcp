/**
 * Tagged error types for the coffee domain.
 *
 * @module
 */
import { Data } from "effect";

/**
 * Error raised when a coffee is not found by name.
 */
export class CoffeeNotFoundError extends Data.TaggedError(
	"CoffeeNotFoundError",
)<{ readonly coffeeName: string }> { }
