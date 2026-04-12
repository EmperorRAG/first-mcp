/**
 * Zod input schema and inferred types for the get-a-coffee tool.
 *
 * @module
 */
import * as z from "zod/v4";

/**
 * Zod validation schema for get-a-coffee tool input.
 *
 * @remarks
 * Validates that the input contains a `name` string property.
 * Used as the `inputSchema` in the MCP tool registration.
 */
export const GetACoffeeInputSchema = z.object({ name: z.string() });

/**
 * Validated input type for the get-a-coffee operation.
 *
 * @remarks
 * Inferred from {@link GetACoffeeInputSchema}. Contains a single `name` property.
 */
export type GetACoffeeInput = z.infer<typeof GetACoffeeInputSchema>;
