/**
 * Schema validation and contract tests for {@link CoffeeSchema}.
 *
 * @remarks
 * Covers three test categories for the production coffee schema:
 *
 * - **Schema rejection** — verifies that invalid inputs (negative IDs,
 *   empty names, out-of-range values, invalid literals, missing
 *   fields) are correctly rejected by
 *   {@link Schema.decodeUnknownSync}.
 * - **JSON Schema snapshot** — locks down the generated JSON Schema
 *   output so that accidental changes to field constraints are
 *   caught before they break the MCP tool contract.
 * - **Type-level regression** — uses `expectTypeOf` to ensure the
 *   {@link Coffee} type alias matches the expected field shape at
 *   compile time.
 *
 * Uses {@link sampleCoffee} from {@link coffee.arbitrary} as the
 * valid base object for rejection tests, overriding one field at a
 * time with an invalid value.
 *
 * @module
 */
import { describe, it, expect, expectTypeOf } from "@effect/vitest";
import { JSONSchema, Schema } from "effect";
import { CoffeeSchema, type Coffee } from "./coffee.type.js";
import { sampleCoffee } from "./coffee.arbitrary.js";

/** @internal */
const decode = Schema.decodeUnknownSync(CoffeeSchema);

describe("CoffeeSchema", () => {
	describe("Schema acceptance", () => {
		it("When all fields are valid, Then decode succeeds", () => {
			const valid = sampleCoffee();
			expect(() => decode(valid)).not.toThrow();
		});
	});

	describe("Schema rejection — id", () => {
		it("When id is negative, Then decode throws", () => {
			const input = { ...sampleCoffee(), id: -1 };
			expect(() => decode(input)).toThrow();
		});

		it("When id is zero, Then decode throws", () => {
			const input = { ...sampleCoffee(), id: 0 };
			expect(() => decode(input)).toThrow();
		});

		it("When id is a float, Then decode throws", () => {
			const input = { ...sampleCoffee(), id: 3.5 };
			expect(() => decode(input)).toThrow();
		});
	});

	describe("Schema rejection — name", () => {
		it("When name is empty, Then decode throws", () => {
			const input = { ...sampleCoffee(), name: "" };
			expect(() => decode(input)).toThrow();
		});
	});

	describe("Schema rejection — size", () => {
		it("When size is an invalid literal, Then decode throws", () => {
			const input = { ...sampleCoffee(), size: "Venti" };
			expect(() => decode(input)).toThrow();
		});
	});

	describe("Schema rejection — price", () => {
		it("When price is zero, Then decode throws", () => {
			const input = { ...sampleCoffee(), price: 0 };
			expect(() => decode(input)).toThrow();
		});

		it("When price is negative, Then decode throws", () => {
			const input = { ...sampleCoffee(), price: -5 };
			expect(() => decode(input)).toThrow();
		});
	});

	describe("Schema rejection — caffeineMg", () => {
		it("When caffeineMg is negative, Then decode throws", () => {
			const input = { ...sampleCoffee(), caffeineMg: -1 };
			expect(() => decode(input)).toThrow();
		});

		it("When caffeineMg exceeds 500, Then decode throws", () => {
			const input = { ...sampleCoffee(), caffeineMg: 501 };
			expect(() => decode(input)).toThrow();
		});

		it("When caffeineMg is a float, Then decode throws", () => {
			const input = { ...sampleCoffee(), caffeineMg: 250.5 };
			expect(() => decode(input)).toThrow();
		});
	});

	describe("Schema rejection — missing fields", () => {
		it("When a required field is missing, Then decode throws", () => {
			const input = { id: 1 };
			expect(() => decode(input)).toThrow();
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
