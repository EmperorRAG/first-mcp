/**
 * Schema validation and contract tests for
 * {@link CoffeeCaffeineContentSchema}.
 *
 * @remarks
 * Covers four test categories for the coffee caffeine-content
 * property schema:
 *
 * - **Schema acceptance** — verifies that valid integers within the
 *   0–500 range (including boundary values) are decoded
 *   successfully.
 * - **Schema rejection** — verifies that invalid inputs (negative,
 *   exceeds maximum, floats, wrong types, `null`) are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **Property-based** — uses `it.prop` to confirm 100 arbitrary
 *   samples are integers between 0 and 500.
 * - **Contract** — JSON Schema snapshot and compile-time type
 *   regression via `expectTypeOf`.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import {
	CoffeeCaffeineContentSchema,
	type CoffeeCaffeineContent,
} from "./coffee-caffeine-content.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeCaffeineContentSchema);

describe("CoffeeCaffeineContentSchema", () => {
	describe("Schema acceptance", () => {
		it("When value is a valid integer in range, Then decode succeeds", () => {
			expect(() => decode(150)).not.toThrow();
		});

		it("When value is the lower bound (0), Then decode succeeds", () => {
			expect(() => decode(0)).not.toThrow();
		});

		it("When value is the upper bound (500), Then decode succeeds", () => {
			expect(() => decode(500)).not.toThrow();
		});
	});

	describe("Schema rejection — constraint violations", () => {
		it("When caffeineMg is negative, Then decode throws", () => {
			expect(() => decode(-1)).toThrow();
		});

		it("When caffeineMg exceeds 500, Then decode throws", () => {
			expect(() => decode(501)).toThrow();
		});

		it("When caffeineMg is a float, Then decode throws", () => {
			expect(() => decode(250.5)).toThrow();
		});
	});

	describe("Schema rejection — wrong types", () => {
		it("When caffeineMg is a string, Then decode throws", () => {
			expect(() => decode("high")).toThrow();
		});

		it("When caffeineMg is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});
	});

	describe("Property-based validation", () => {
		it.prop(
			"property: 100 samples are integers between 0 and 500",
			{ caffeineMg: CoffeeCaffeineContentSchema },
			({ caffeineMg }) => {
				expect(caffeineMg).toBeGreaterThanOrEqual(0);
				expect(caffeineMg).toBeLessThanOrEqual(500);
				expect(Number.isInteger(caffeineMg)).toBe(true);
			},
			{ fastCheck: { numRuns: 100 } },
		);
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeeCaffeineContentSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("CoffeeCaffeineContent type equals number", () => {
			expectTypeOf<CoffeeCaffeineContent>().toEqualTypeOf<number>();
		});
	});
});
