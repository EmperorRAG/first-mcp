/**
 * Arbitrary data generation helpers for the {@link Coffee} entity.
 *
 * @remarks
 * Leverages the `arbitrary` annotations already present on
 * {@link CoffeeSchema} (which use
 * {@link https://www.npmjs.com/package/@faker-js/faker | @faker-js/faker}
 * internally) via `Arbitrary.make`.  Exports a ready-to-use
 * {@link CoffeeArbitrary} plus two convenience sampling functions:
 *
 * | Export | Purpose |
 * |--------|---------|
 * | {@link CoffeeArbitrary} | `fast-check` `Arbitrary<Coffee>` derived from {@link CoffeeSchema} |
 * | {@link sampleCoffee} | Generate one {@link Coffee} with optional partial overrides |
 * | {@link sampleCoffees} | Generate `count` {@link Coffee} entities |
 *
 * @example
 * ```ts
 * import { sampleCoffee, sampleCoffees } from "./coffee.arbitrary.js";
 *
 * const one = sampleCoffee();
 * const custom = sampleCoffee({ name: "Test Brew", iced: true });
 * const many = sampleCoffees(10);
 * ```
 *
 * @module
 */
import { Arbitrary, FastCheck } from "effect";
import { CoffeeSchema, type Coffee } from "./coffee.type.js";

/**
 * `fast-check` {@link Arbitrary} for the {@link Coffee} entity,
 * derived from the annotated {@link CoffeeSchema}.
 *
 * @remarks
 * Calls `Arbitrary.make(CoffeeSchema)` once at module load.  The
 * schema's per-field `arbitrary` annotations (Faker-powered for
 * `name` and `price`, constrained integers for `id` and
 * `caffeineMg`, literal union for `size`) ensure that every
 * generated value is realistic and schema-valid.
 */
export const CoffeeArbitrary = Arbitrary.make(CoffeeSchema);

/**
 * Generates a single {@link Coffee} entity with optional property
 * overrides.
 *
 * @remarks
 * Samples one value from {@link CoffeeArbitrary} via
 * {@link FastCheck.sample} and merges the provided `overrides` via
 * object spread.  Override fields are **not** re-validated against
 * {@link CoffeeSchema} — callers are responsible for providing
 * valid values when overriding.
 *
 * @param overrides - Partial {@link Coffee} properties to merge
 *   over the randomly generated base.
 * @returns A complete {@link Coffee} entity.
 *
 * @example
 * ```ts
 * const iced = sampleCoffee({ iced: true, size: "Large" });
 * ```
 */
export function sampleCoffee(overrides: Partial<Coffee> = {}): Coffee {
	const [base] = FastCheck.sample(CoffeeArbitrary, 1);
	return { ...base, ...overrides };
}

/**
 * Generates an array of {@link Coffee} entities.
 *
 * @remarks
 * Delegates to {@link FastCheck.sample} with the given `count`.
 * Each entity is independently sampled from {@link CoffeeArbitrary},
 * so field values vary across the returned array.
 *
 * @param count - Number of coffees to generate (defaults to `5`).
 * @returns An array of `count` {@link Coffee} entities.
 *
 * @example
 * ```ts
 * const batch = sampleCoffees(20);
 * ```
 */
export function sampleCoffees(count = 5): Coffee[] {
	return FastCheck.sample(CoffeeArbitrary, count);
}
