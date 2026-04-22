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
 * Each property schema is defined in its own module under the
 * `type/` directory and composed here:
 *
 * | Field | Source Module |
 * |-------|--------------|
 * | `id` | {@link CoffeeIdSchema} from `coffee-id/` |
 * | `name` | {@link CoffeeNameSchema} from `coffee-name/` |
 * | `size` | {@link CoffeeSizeSchema} from `coffee-size/` |
 * | `price` | {@link CoffeePriceSchema} from `coffee-price/` |
 * | `iced` | {@link CoffeeIcedSchema} from `coffee-iced/` |
 * | `caffeineMg` | {@link CoffeeCaffeineContentSchema} from `coffee-caffeine-content/` |
 *
 * @module
 */
import { Schema } from "effect";
import { CoffeeIdSchema } from "../coffee-id/coffee-id.type.js";
import { CoffeeNameSchema } from "../coffee-name/coffee-name.type.js";
import { CoffeeSizeSchema } from "../coffee-size/coffee-size.type.js";
import { CoffeePriceSchema } from "../coffee-price/coffee-price.type.js";
import { CoffeeIcedSchema } from "../coffee-iced/coffee-iced.type.js";
import { CoffeeCaffeineContentSchema } from "../coffee-caffeine-content/coffee-caffeine-content.type.js";

/**
 * Effect {@link Schema.Struct} defining the shape of a coffee catalog
 * entry.
 *
 * @remarks
 * Acts as the single source of truth for the {@link Coffee} entity.  The
 * struct composes six property schemas—each defined in its own module
 * under `type/`—with semantic constraints and Faker-powered arbitrary
 * annotations:
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
	id: CoffeeIdSchema,

	/** Display name of the coffee drink (e.g., "Flat White", "Espresso"). */
	name: CoffeeNameSchema,

	/** Cup size — one of `"Small"`, `"Medium"`, or `"Large"`. */
	size: CoffeeSizeSchema,

	/** Price in US dollars (positive number). */
	price: CoffeePriceSchema,

	/** Whether the drink is served iced. */
	iced: CoffeeIcedSchema,

	/** Caffeine content in milligrams (integer, 0–500). */
	caffeineMg: CoffeeCaffeineContentSchema,
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
