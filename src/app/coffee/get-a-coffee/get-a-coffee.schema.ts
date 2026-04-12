/**
 * Effect Schema for get-a-coffee tool input validation.
 *
 * @module
 */
import { JSONSchema, Schema } from "effect";
import { toStandardSchema } from "../../shared/standard-schema-bridge.js";

/**
 * Schema for validating get-a-coffee tool input.
 *
 * @remarks
 * Contains a single `name` field identifying the coffee to retrieve.
 */
export const GetACoffeeInput = Schema.Struct({ name: Schema.String });

/**
 * Inferred TypeScript type for validated get-a-coffee input.
 */
export type GetACoffeeInput = typeof GetACoffeeInput.Type;

/**
 * JSON Schema representation for MCP SDK tool registration.
 */
export const GetACoffeeInputJsonSchema = JSONSchema.make(GetACoffeeInput);

/**
 * StandardSchemaWithJSON adapter for MCP SDK `registerTool()`.
 */
export const GetACoffeeInputStandard = toStandardSchema(GetACoffeeInput);
