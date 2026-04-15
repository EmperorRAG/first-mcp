/**
 * Bridge adapting Effect {@link Schema} instances into the
 * `StandardSchemaWithJSON` interface consumed by the MCP SDK.
 *
 * @remarks
 * The MCP SDK's `registerTool()` expects tool input schemas to satisfy the
 * `StandardSchemaWithJSON` contract — an object whose `~standard` property
 * exposes both a `validate` function and a `jsonSchema` accessor.  Effect
 * Schema does not implement this interface natively, so this module
 * provides a thin adapter ({@link toStandardSchema}) that bridges the two
 * worlds.
 *
 * The adapter delegates to:
 *
 * - {@link Schema.decodeUnknownEither} — for runtime validation, producing
 *   either a decoded value or structured validation issues.
 * - {@link JSONSchema.make} — for the JSON Schema representation that the
 *   SDK serializes into the tool's metadata.
 *
 * @see {@link https://github.com/standard-schema/standard-schema | Standard Schema specification}
 *
 * @module
 */
import { JSONSchema, ParseResult, Schema } from "effect";

/**
 * Adapts an Effect {@link Schema.Schema} into the `StandardSchemaWithJSON`
 * interface required by the MCP SDK's `registerTool()`.
 *
 * @remarks
 * The returned object carries a `~standard` property (version `1`,
 * vendor `"effect"`) with two capabilities:
 *
 * - **`validate(value)`** — Runs {@link Schema.decodeUnknownEither} against
 *   the provided `value`.  On success (`Right`) it returns
 *   `{ value: decodedValue }`.  On failure (`Left`) it formats the
 *   {@link ParseResult} errors via
 *   {@link ParseResult.ArrayFormatter.formatErrorSync} and returns an
 *   `{ issues }` array where each issue contains a `message` and a `path`
 *   of `{ key }` segments.
 *
 * - **`jsonSchema`** — Exposes `input()` and `output()` accessors that both
 *   return the same JSON Schema record produced by {@link JSONSchema.make}.
 *   The record is computed once at construction time and spread into a
 *   plain `Record<string, unknown>` to satisfy the SDK's type expectation.
 *
 * @typeParam A - The decoded (output) type of the schema.
 * @typeParam I - The encoded (input) type of the schema.
 *
 * @param schema - The Effect {@link Schema.Schema} to adapt.  Must be
 *        JSON-Schema-compatible (no opaque transformations that
 *        {@link JSONSchema.make} cannot represent).
 * @returns A `StandardSchemaWithJSON`-compatible object that can be passed
 *          directly to the MCP SDK's `registerTool()` `inputSchema` option.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { toStandardSchema } from "./standard-schema-bridge.js";
 *
 * const InputSchema = Schema.Struct({ id: Schema.String });
 * server.registerTool("my-tool", {
 *   inputSchema: toStandardSchema(InputSchema),
 * }, handler);
 * ```
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
