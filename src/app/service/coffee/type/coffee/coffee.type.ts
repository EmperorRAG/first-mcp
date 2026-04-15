/**
 * Core domain types and schemas for the coffee catalog.
 *
 * @remarks
 * This module defines the single source of truth for the {@link Coffee}
 * entity shape via an Effect {@link Schema.Struct}.  The
 * {@link CoffeeSchema} drives both runtime validation and JSON Schema
 * generation (through `toStandardSchema` in the MCP tool layer),
 * while the {@link Coffee} type alias provides compile-time safety
 * throughout the domain, service, and repository layers.
 *
 * Each schema field carries semantic constraints (e.g. positive
 * integers, non-empty strings, bounded ranges) and an `arbitrary`
 * annotation powered by {@link https://www.npmjs.com/package/@faker-js/faker | @faker-js/faker}
 * so that `Arbitrary.make(CoffeeSchema)` produces realistic test
 * data out of the box.
 *
 * @module
 */
import { Schema } from "effect";
import { faker } from "@faker-js/faker";

/**
 * Effect {@link Schema.Struct} defining the shape of a coffee catalog
 * entry.
 *
 * @remarks
 * Acts as the single source of truth for the {@link Coffee} entity.  The
 * struct declares six fields with semantic constraints and
 * Faker-powered arbitrary annotations:
 *
 * | Field | Schema | Constraint | Arbitrary |
 * |-------|--------|------------|-----------|
 * | `id` | `Schema.Number` | positive integer | `fc.integer({ min: 1, max: 10_000 })` |
 * | `name` | `Schema.NonEmptyString` | at least 1 character | `faker.commerce.productName()` |
 * | `size` | `Schema.Literal` | `"Small"` &#124; `"Medium"` &#124; `"Large"` | `fc.constantFrom(…)` |
 * | `price` | `Schema.Number` | positive | `faker.commerce.price({ min: 1, max: 15 })` |
 * | `iced` | `Schema.Boolean` | — | default boolean arbitrary |
 * | `caffeineMg` | `Schema.Number` | integer 0–500 | `fc.integer({ min: 0, max: 500 })` |
 *
 * The schema is consumed by the MCP tool layer (via
 * `toStandardSchema`) to generate the JSON Schema advertised to MCP
 * clients, and by the repository layer to type the in-memory catalog.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeSchema } from "./coffee.type.js";
 *
 * const decoded = Schema.decodeUnknownSync(CoffeeSchema)({
 *   id: 1, name: "Latte", size: "Large",
 *   price: 5.25, iced: true, caffeineMg: 150,
 * });
 * ```
 */
export const CoffeeSchema = Schema.Struct({
	/** Unique positive-integer identifier for the coffee drink. */
	id: Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
		arbitrary: () => (fc) => fc.integer({ min: 1, max: 10_000 }),
	}),

	/** Display name of the coffee drink (e.g., "Flat White", "Espresso"). */
	name: Schema.NonEmptyString.annotations({
		arbitrary: () => (fc) =>
			fc.constant(null).map(() => faker.commerce.productName()),
	}),

	/** Cup size — one of `"Small"`, `"Medium"`, or `"Large"`. */
	size: Schema.Literal("Small", "Medium", "Large").annotations({
		arbitrary: () => (fc) => fc.constantFrom("Small", "Medium", "Large"),
	}),

	/** Price in US dollars (positive number). */
	price: Schema.Number.pipe(Schema.positive()).annotations({
		arbitrary: () => (fc) =>
			fc
				.constant(null)
				.map(() => parseFloat(faker.commerce.price({ min: 1, max: 15 }))),
	}),

	/** Whether the drink is served iced. */
	iced: Schema.Boolean,

	/** Caffeine content in milligrams (integer, 0–500). */
	caffeineMg: Schema.Number.pipe(Schema.int(), Schema.between(0, 500)).annotations({
		arbitrary: () => (fc) => fc.integer({ min: 0, max: 500 }),
	}),
});

/**
 * Represents a coffee drink available in the catalog.
 *
 * @remarks
 * Derived from {@link CoffeeSchema} via `typeof CoffeeSchema.Type`.  This
 * type alias is used throughout the coffee domain — in the
 * `CoffeeRepositoryShape` contract, service return types, and
 * controller response formatting — ensuring that any schema change
 * automatically propagates to all dependent code.
 */
export type Coffee = typeof CoffeeSchema.Type;
