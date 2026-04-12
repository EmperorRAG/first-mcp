/**
 * Bridge: Effect Schema → Standard Schema (StandardSchemaWithJSON).
 *
 * @remarks
 * The MCP SDK's `registerTool()` requires `StandardSchemaWithJSON` objects
 * (both `~standard.validate` and `~standard.jsonSchema`). Effect Schema does
 * not implement this interface natively, so this adapter bridges the gap.
 *
 * @module
 */
import { JSONSchema, ParseResult, Schema } from "effect";

/**
 * Adapts an Effect Schema into the `StandardSchemaWithJSON` interface
 * required by the MCP SDK's `registerTool()`.
 *
 * @remarks
 * Provides both `~standard.validate` (via `Schema.decodeUnknownEither`)
 * and `~standard.jsonSchema` (via `JSONSchema.make()`).
 *
 * @param schema - An Effect Schema to adapt.
 * @returns A `StandardSchemaWithJSON`-compatible object for MCP SDK.
 */
export function toStandardSchema<A, I>(
	schema: Schema.Schema<A, I>,
) {
	const jsonSchema = JSONSchema.make(schema);
	const jsonSchemaRecord: Record<string, unknown> = { ...jsonSchema };

	return {
		"~standard": {
			version: 1 as const,
			vendor: "effect",
			validate: (value: unknown) => {
				const result = Schema.decodeUnknownEither(schema)(value);
				if (result._tag === "Right") {
					return { value: result.right };
				}
				const issues =
					ParseResult.ArrayFormatter.formatErrorSync(
						result.left,
					);
				return {
					issues: issues.map((issue) => ({
						message: issue.message,
						path: issue.path.map((p) => ({
							key: p,
						})),
					})),
				};
			},
			jsonSchema: {
				input: () => jsonSchemaRecord,
				output: () => jsonSchemaRecord,
			},
		},
	};
}
