/**
 * Struct-level validation and contract tests for {@link CoffeeSchema}.
 *
 * @remarks
 * Covers struct-level concerns only — individual field constraint
 * tests live in each property schema's co-located spec file under
 * `type/`.
 *
 * - **Schema acceptance** — verifies that a fully valid entity
 *   decodes, and that extra/unknown fields are tolerated.
 * - **Schema rejection** — verifies that missing fields, empty
 *   objects, and non-object inputs are rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **JSON Schema snapshot** — locks down the generated JSON Schema
 *   output so that accidental changes to the struct composition are
 *   caught before they break the MCP tool contract.
 * - **Type-level regression** — uses `expectTypeOf` to ensure the
 *   {@link Coffee} type alias matches the expected field shape at
 *   compile time.
 *
 * Uses `Arbitrary.make(CoffeeSchema)` with `FastCheck.sample` for
 * inline test data generation — no dedicated arbitrary module.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { Arbitrary, FastCheck, JSONSchema, Schema } from "effect";
import { CoffeeSchema, type Coffee } from "./coffee.type.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeSchema);

/** @internal */
const sampleCoffee = (): Coffee =>
	FastCheck.sample(Arbitrary.make(CoffeeSchema), 1)[0];

describe("CoffeeSchema", () => {
	describe("Schema acceptance", () => {
		it("When all fields are valid, Then decode succeeds", () => {
			const valid = sampleCoffee();
			expect(() => decode(valid)).not.toThrow();
		});

		it("When input contains extra unknown fields, Then decode succeeds", () => {
			const valid = { ...sampleCoffee(), extra: true };
			expect(() => decode(valid)).not.toThrow();
		});
	});

	describe("Schema rejection — missing fields", () => {
		it("When a required field is missing, Then decode throws", () => {
			const input = { id: 1 };
			expect(() => decode(input)).toThrow();
		});

		it("When input is an empty object, Then decode throws", () => {
			expect(() => decode({})).toThrow();
		});
	});

	describe("Schema rejection — non-object inputs", () => {
		it("When input is null, Then decode throws", () => {
			expect(() => decode(null)).toThrow();
		});

		it("When input is undefined, Then decode throws", () => {
			expect(() => decode(undefined)).toThrow();
		});

		it("When input is an array, Then decode throws", () => {
			expect(() => decode([])).toThrow();
		});

		it("When input is a primitive, Then decode throws", () => {
			expect(() => decode(42)).toThrow();
		});
	});

	describe("JSON Schema snapshot", () => {
		it("When generating JSON Schema, Then output matches snapshot", () => {
			const jsonSchema = JSONSchema.make(CoffeeSchema);
			expect(jsonSchema).toMatchSnapshot();
		});
	});

	describe("Type-level regression", () => {
		it("Coffee type has the expected shape", () => {
			expectTypeOf<Coffee>().toEqualTypeOf<{
				readonly id: number;
				readonly name: string;
				readonly size: "Small" | "Medium" | "Large";
				readonly price: number;
				readonly iced: boolean;
				readonly caffeineMg: number;
			}>();
		});
	});
});
