/**
 * Schema for the coffee entity's iced flag.
 *
 * @remarks
 * Defines a boolean schema used as the `iced` field in
 * {@link CoffeeSchema}.  Uses the default `fast-check` boolean
 * arbitrary—no custom annotation is needed.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * Effect {@link Schema} for whether a coffee drink is served iced.
 *
 * @remarks
 * A plain {@link Schema.Boolean} with no additional constraints.
 * Separated into its own module so the {@link CoffeeSchema} struct
 * can compose all property schemas from their canonical locations.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { CoffeeIcedSchema } from "./coffee-iced.type.js";
 *
 * const iced = Schema.decodeUnknownSync(CoffeeIcedSchema)(true);
 * ```
 */
export const CoffeeIcedSchema = Schema.Boolean;

/**
 * Whether a coffee drink is served iced.
 *
 * @remarks
 * Derived from {@link CoffeeIcedSchema} via `typeof CoffeeIcedSchema.Type`.
 */
export type CoffeeIced = typeof CoffeeIcedSchema.Type;
