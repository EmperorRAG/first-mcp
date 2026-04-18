/**
 * Schema validation and contract tests for {@link CoffeeIdSchema}.
 *
 * @remarks
 * Covers four test categories for the coffee identifier property
 * schema:
 *
 * - **Schema acceptance** — verifies that valid positive integers
 *   (including boundary value `1`) are decoded successfully.
 * - **Schema rejection** — verifies that invalid inputs (negative,
 *   zero, floats, wrong types, `null`) are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **Property-based** — uses `it.prop` to confirm 100 arbitrary
 *   samples satisfy positive-integer constraints.
 * - **Contract** — JSON Schema snapshot and compile-time type
 *   regression via `expectTypeOf`.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import {
	CoffeeIdSchema,
	type CoffeeId,
} from "./coffee-id.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeIdSchema);

describe("CoffeeIdSchema", () => {
	describe("Schema acceptance", () => {
		it("When value is a valid positive integer, Then decode succeeds", () => {
			expect(() => decode(42)).not.toThrow();
		});

		it("When value is the minimum valid id (1), Then decode succeeds", () => {
			expect(() => decode(1)).not.toThrow();
		});
	});

	describe("Schema rejection — constraint violations", () => {
		it("When id is negative, Then decode throws", () => {
			expect(() => decode(-1)).toThrow();
		});

		it("When id is zero, Then decode throws", () => {
			expect(() => decode(0)).toThrow();
		});

		it("When id is a float, Then decode throws", () => {
			expect(() => decode(3.5)).toThrow();
		});
	});

	describe("Schema rejection — wrong types", () => {
		it("When id is a string, Then decode throws", () => {
			expect(() => decode("abc")).toThrow();
		});

		it("When id is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});
	});

	describe("Property-based validation", () => {
		it.prop(
			"property: 100 samples are positive integers",
			{ id: CoffeeIdSchema },
			({ id }) => {
				expect(id).toBeGreaterThan(0);
				expect(Number.isInteger(id)).toBe(true);
			},
			{ fastCheck: { numRuns: 100 } },
		);
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeeIdSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("CoffeeId type equals number", () => {
			expectTypeOf<CoffeeId>().toEqualTypeOf<number>();
		});
	});
});
