/**
 * Schema validation and contract tests for {@link CoffeeSizeSchema}.
 *
 * @remarks
 * Covers four test categories for the coffee cup size property
 * schema:
 *
 * - **Schema acceptance** — verifies that each of the three valid
 *   literals (`"Small"`, `"Medium"`, `"Large"`) decode successfully.
 * - **Schema rejection** — verifies that invalid inputs (unrecognised
 *   literals, wrong case, wrong types, `null`) are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **Property-based** — uses `it.prop` to confirm 100 arbitrary
 *   samples are one of the three allowed literals.
 * - **Contract** — JSON Schema snapshot and compile-time type
 *   regression via `expectTypeOf`.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import {
	CoffeeSizeSchema,
	type CoffeeSize,
} from "./coffee-size.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeSizeSchema);

describe("CoffeeSizeSchema", () => {
	describe("Schema acceptance", () => {
		it("When value is 'Small', Then decode succeeds", () => {
			expect(() => decode("Small")).not.toThrow();
		});

		it("When value is 'Medium', Then decode succeeds", () => {
			expect(() => decode("Medium")).not.toThrow();
		});

		it("When value is 'Large', Then decode succeeds", () => {
			expect(() => decode("Large")).not.toThrow();
		});
	});

	describe("Schema rejection — constraint violations", () => {
		it("When size is an unrecognised literal, Then decode throws", () => {
			expect(() => decode("Venti")).toThrow();
		});

		it("When size is lowercase, Then decode throws", () => {
			expect(() => decode("small")).toThrow();
		});

		it("When size is uppercase, Then decode throws", () => {
			expect(() => decode("LARGE")).toThrow();
		});
	});

	describe("Schema rejection — wrong types", () => {
		it("When size is a number, Then decode throws", () => {
			expect(() => decode(1)).toThrow();
		});

		it("When size is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});
	});

	describe("Property-based validation", () => {
		it.prop(
			"property: 100 samples are one of Small, Medium, or Large",
			{ size: CoffeeSizeSchema },
			({ size }) => {
				expect(["Small", "Medium", "Large"]).toContain(size);
			},
			{ fastCheck: { numRuns: 100 } },
		);
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeeSizeSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("CoffeeSize type equals the literal union", () => {
			expectTypeOf<CoffeeSize>().toEqualTypeOf<
				"Small" | "Medium" | "Large"
			>();
		});
	});
});
