/**
 * Schema validation and contract tests for {@link CoffeeIcedSchema}.
 *
 * @remarks
 * Covers three test categories for the coffee iced flag property
 * schema:
 *
 * - **Schema acceptance** — verifies that both `true` and `false`
 *   are decoded successfully.
 * - **Schema rejection** — verifies that truthy/falsy non-boolean
 *   values (`1`, `0`, `"true"`, `null`) are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **Contract** — JSON Schema snapshot and compile-time type
 *   regression via `expectTypeOf`.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import {
	CoffeeIcedSchema,
	type CoffeeIced,
} from "./coffee-iced.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeIcedSchema);

describe("CoffeeIcedSchema", () => {
	describe("Schema acceptance", () => {
		it("When value is true, Then decode succeeds", () => {
			expect(() => decode(true)).not.toThrow();
		});

		it("When value is false, Then decode succeeds", () => {
			expect(() => decode(false)).not.toThrow();
		});
	});

	describe("Schema rejection — wrong types", () => {
		it("When iced is truthy integer 1, Then decode throws", () => {
			expect(() => decode(1)).toThrow();
		});

		it("When iced is falsy integer 0, Then decode throws", () => {
			expect(() => decode(0)).toThrow();
		});

		it("When iced is a string, Then decode throws", () => {
			expect(() => decode("true")).toThrow();
		});

		it("When iced is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeeIcedSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("CoffeeIced type equals boolean", () => {
			expectTypeOf<CoffeeIced>().toEqualTypeOf<boolean>();
		});
	});
});
