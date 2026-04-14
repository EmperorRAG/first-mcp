/**
 * Core domain types and schemas for the coffee catalog.
 *
 * @remarks
 * This module defines the single source of truth for the {@link Coffee}
 * entity shape via an Effect {@link Schema.Struct}.  The
 * {@link CoffeeSchema} drives both runtime validation and JSON Schema
 * generation (through {@link toStandardSchema} in the MCP tool layer),
 * while the {@link Coffee} type alias provides compile-time safety
 * throughout the domain, service, and repository layers.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * Effect {@link Schema.Struct} defining the shape of a coffee catalog
 * entry.
 *
 * @remarks
 * Acts as the single source of truth for the {@link Coffee} entity.  The
 * struct declares six fields:
 *
 * | Field | Schema | Purpose |
 * |-------|--------|---------|
 * | `id` | {@link Schema.Number} | Unique numeric identifier |
 * | `name` | {@link Schema.String} | Display name (e.g. `"Flat White"`) |
 * | `size` | {@link Schema.String} | Cup size (`"Small"`, `"Medium"`, `"Large"`) |
 * | `price` | {@link Schema.Number} | Price in US dollars |
 * | `iced` | {@link Schema.Boolean} | Whether the drink is served iced |
 * | `caffeineMg` | {@link Schema.Number} | Caffeine content in milligrams |
 *
 * The schema is consumed by the MCP tool layer (via
 * `toStandardSchema`) to generate the JSON Schema advertised to MCP
 * clients, and by the repository layer to type the in-memory catalog.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeSchema } from "./types.js";
 *
 * const decoded = Schema.decodeUnknownSync(CoffeeSchema)({
 *   id: 1, name: "Latte", size: "Large",
 *   price: 5.25, iced: true, caffeineMg: 150,
 * });
 * ```
 */
export const CoffeeSchema = Schema.Struct({
	/** Unique identifier for the coffee drink. */
	id: Schema.Number,
	/** Display name of the coffee drink (e.g., "Flat White", "Espresso"). */
	name: Schema.String,
	/** Cup size (e.g., "Small", "Medium", "Large"). */
	size: Schema.String,
	/** Price in dollars. */
	price: Schema.Number,
	/** Whether the drink is served iced. */
	iced: Schema.Boolean,
	/** Caffeine content in milligrams. */
	caffeineMg: Schema.Number,
});

/**
 * Represents a coffee drink available in the catalog.
 *
 * @remarks
 * Derived from {@link CoffeeSchema} via `typeof CoffeeSchema.Type`.  This
 * type alias is used throughout the coffee domain — in the
 * {@link CoffeeRepositoryShape} contract, service return types, and
 * controller response formatting — ensuring that any schema change
 * automatically propagates to all dependent code.
 */
export type Coffee = typeof CoffeeSchema.Type;
