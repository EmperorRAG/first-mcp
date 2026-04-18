/**
 * Schema validation and contract tests for {@link CoffeePriceSchema}.
 *
 * @remarks
 * Covers four test categories for the coffee price property schema:
 *
 * - **Schema acceptance** — verifies that valid positive numbers
 *   (including decimals) are decoded successfully.
 * - **Schema rejection** — verifies that invalid inputs (zero,
 *   negative, wrong types, `null`) are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **Property-based** — uses `it.prop` to confirm 100 arbitrary
 *   samples are positive numbers.
 * - **Contract** — JSON Schema snapshot and compile-time type
 *   regression via `expectTypeOf`.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import {
	CoffeePriceSchema,
	type CoffeePrice,
} from "./coffee-price.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeePriceSchema);

describe("CoffeePriceSchema", () => {
	describe("Schema acceptance", () => {
		it("When value is a valid positive number, Then decode succeeds", () => {
			expect(() => decode(5.25)).not.toThrow();
		});

		it("When value is a decimal price, Then decode succeeds", () => {
			expect(() => decode(4.99)).not.toThrow();
		});
	});

	describe("Schema rejection — constraint violations", () => {
		it("When price is zero, Then decode throws", () => {
			expect(() => decode(0)).toThrow();
		});

		it("When price is negative, Then decode throws", () => {
			expect(() => decode(-5)).toThrow();
		});
	});

	describe("Schema rejection — wrong types", () => {
		it("When price is a string, Then decode throws", () => {
			expect(() => decode("free")).toThrow();
		});

		it("When price is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});
	});

	describe("Property-based validation", () => {
		it.prop(
			"property: 100 samples are positive numbers",
			{ price: CoffeePriceSchema },
			({ price }) => {
				expect(price).toBeGreaterThan(0);
			},
			{ fastCheck: { numRuns: 100 } },
		);
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeePriceSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("CoffeePrice type equals number", () => {
			expectTypeOf<CoffeePrice>().toEqualTypeOf<number>();
		});
	});
});
