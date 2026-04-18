/**
 * Schema validation and contract tests for {@link CoffeeNameSchema}.
 *
 * @remarks
 * Covers four test categories for the coffee display name property
 * schema:
 *
 * - **Schema acceptance** — verifies that valid non-empty strings
 *   are decoded successfully.
 * - **Schema rejection** — verifies that invalid inputs (empty
 *   string, wrong types, `null`) are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **Property-based** — uses `it.prop` to confirm 100 arbitrary
 *   samples are non-empty strings.
 * - **Contract** — JSON Schema snapshot and compile-time type
 *   regression via `expectTypeOf`.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import {
	CoffeeNameSchema,
	type CoffeeName,
} from "./coffee-name.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeNameSchema);

describe("CoffeeNameSchema", () => {
	describe("Schema acceptance", () => {
		it("When value is a valid non-empty string, Then decode succeeds", () => {
			expect(() => decode("Flat White")).not.toThrow();
		});
	});

	describe("Schema rejection — constraint violations", () => {
		it("When name is empty, Then decode throws", () => {
			expect(() => decode("")).toThrow();
		});
	});

	describe("Schema rejection — wrong types", () => {
		it("When name is a number, Then decode throws", () => {
			expect(() => decode(123)).toThrow();
		});

		it("When name is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});
	});

	describe("Property-based validation", () => {
		it.prop(
			"property: 100 samples are non-empty strings",
			{ name: CoffeeNameSchema },
			({ name }) => {
				expect(typeof name).toBe("string");
				expect(name.length).toBeGreaterThan(0);
			},
			{ fastCheck: { numRuns: 100 } },
		);
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeeNameSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("CoffeeName type equals string", () => {
			expectTypeOf<CoffeeName>().toEqualTypeOf<string>();
		});
	});
});
