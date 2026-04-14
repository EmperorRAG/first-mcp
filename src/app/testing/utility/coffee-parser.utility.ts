/**
 * JSON parsing and validation utilities for {@link Coffee} entities
 * in test assertions.
 *
 * @deprecated All exports in this module are deprecated.  The
 * Effect-TS migration validates coffee responses directly via
 * {@link Schema.decodeUnknownSync} in individual test files or
 * through service-level `executeFormatted` assertions.  Will be
 * removed in a future cleanup pass.
 *
 * @remarks
 * Uses {@link CoffeeSchema} from the coffee domain to decode and
 * validate unknown values at runtime.  Two non-exported decoders
 * ({@link decodeCoffee}, {@link decodeCoffeeArray}) power the
 * public parsing functions.
 *
 * @module
 */
import { Schema } from "effect";
import { CoffeeSchema, type Coffee } from "../../service/coffee/types.js";

/**
 * Pre-compiled decoder for a single {@link Coffee} entity.
 *
 * @deprecated Used only by the deprecated {@link parseCoffeeJson}.
 *
 * @remarks
 * Created once at module load via
 * {@link Schema.decodeUnknownSync}({@link CoffeeSchema}) to avoid
 * repeated schema compilation.
 *
 * @internal
 */
const decodeCoffee = Schema.decodeUnknownSync(CoffeeSchema);

/**
 * Pre-compiled decoder for an array of {@link Coffee} entities.
 *
 * @deprecated Used only by the deprecated
 * {@link parseCoffeeArrayJson}.
 *
 * @remarks
 * Wraps {@link CoffeeSchema} in {@link Schema.Array} and compiles
 * once via {@link Schema.decodeUnknownSync}.
 *
 * @internal
 */
const decodeCoffeeArray = Schema.decodeUnknownSync(Schema.Array(CoffeeSchema));

/**
 * Type guard that validates whether an `unknown` value conforms to
 * {@link CoffeeSchema}.
 *
 * @deprecated No longer imported by any test.  Use
 * `Schema.is(CoffeeSchema)` directly in assertions instead.
 *
 * @remarks
 * Delegates to {@link Schema.is} with {@link CoffeeSchema} and
 * returns a type predicate narrowing to {@link Coffee}.
 *
 * @param value - The value to validate.
 * @returns `true` if `value` conforms to {@link CoffeeSchema}.
 */
export function isCoffee(value: unknown): value is Coffee {
	return Schema.is(CoffeeSchema)(value);
}

/**
 * Parses a JSON string and validates it as a single {@link Coffee}
 * entity.
 *
 * @deprecated No longer imported by any test.  Use
 * `Schema.decodeUnknownSync(CoffeeSchema)(JSON.parse(text))`
 * directly instead.
 *
 * @remarks
 * Calls `JSON.parse` then pipes the result through the pre-compiled
 * {@link decodeCoffee} decoder.  Throws a `ParseResult` error
 * if the parsed value does not conform to {@link CoffeeSchema}.
 *
 * @param text - A JSON string representing a {@link Coffee} object.
 * @returns The decoded {@link Coffee} entity.
 * @throws If the parsed value does not conform to
 *   {@link CoffeeSchema}.
 */
export function parseCoffeeJson(text: string): Coffee {
	return decodeCoffee(JSON.parse(text));
}

/**
 * Parses a JSON string and validates it as an array of {@link Coffee}
 * entities.
 *
 * @deprecated No longer imported by any test.  Use
 * `Schema.decodeUnknownSync(Schema.Array(CoffeeSchema))(JSON.parse(text))`
 * directly instead.
 *
 * @remarks
 * Calls `JSON.parse` then pipes the result through the pre-compiled
 * {@link decodeCoffeeArray} decoder.  Spreads the decoded
 * `ReadonlyArray` into a mutable `Coffee[]` for test convenience.
 *
 * @param text - A JSON string representing a {@link Coffee} array.
 * @returns The decoded array of {@link Coffee} entities.
 * @throws If any element does not conform to {@link CoffeeSchema}.
 */
export function parseCoffeeArrayJson(text: string): Coffee[] {
	return [...decodeCoffeeArray(JSON.parse(text))];
}