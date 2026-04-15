/**
 * Unit tests for the {@link CoffeeArbitrary} and its convenience
 * helpers ({@link sampleCoffee}, {@link sampleCoffees}).
 *
 * @remarks
 * Validates that Faker-annotated arbitrary generation produces
 * values conforming to {@link CoffeeSchema} constraints.  Uses
 * both deterministic sampling (`FastCheck.sample`) and
 * property-based assertions (`FastCheck.assert`) to cover:
 *
 * - Schema decode round-trip on sampled data.
 * - Per-field constraint validation (positive id, non-empty name,
 *   literal size, positive price, caffeineMg 0–500).
 * - Override merging via {@link sampleCoffee}.
 * - Batch generation via {@link sampleCoffees}.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { FastCheck, Schema } from "effect";
import { CoffeeSchema } from "./coffee.type.js";
import {
	CoffeeArbitrary,
	sampleCoffee,
	sampleCoffees,
} from "./coffee.arbitrary.js";

/** @internal */
const decodeCoffee = Schema.decodeUnknownSync(CoffeeSchema);

describe("CoffeeArbitrary", () => {
	describe("When sampling coffees, Then all values conform to CoffeeSchema", () => {
		it("property: 100 samples decode successfully against CoffeeSchema", () => {
			FastCheck.assert(
				FastCheck.property(CoffeeArbitrary, (coffee) => {
					expect(() => decodeCoffee(coffee)).not.toThrow();
				}),
				{ numRuns: 100 },
			);
		});

		it("property: id is a positive integer", () => {
			FastCheck.assert(
				FastCheck.property(CoffeeArbitrary, (coffee) => {
					expect(coffee.id).toBeGreaterThan(0);
					expect(Number.isInteger(coffee.id)).toBe(true);
				}),
				{ numRuns: 100 },
			);
		});

		it("property: name is a non-empty string", () => {
			FastCheck.assert(
				FastCheck.property(CoffeeArbitrary, (coffee) => {
					expect(typeof coffee.name).toBe("string");
					expect(coffee.name.length).toBeGreaterThan(0);
				}),
				{ numRuns: 100 },
			);
		});

		it("property: size is one of Small, Medium, or Large", () => {
			FastCheck.assert(
				FastCheck.property(CoffeeArbitrary, (coffee) => {
					expect(["Small", "Medium", "Large"]).toContain(coffee.size);
				}),
				{ numRuns: 100 },
			);
		});

		it("property: price is a positive number", () => {
			FastCheck.assert(
				FastCheck.property(CoffeeArbitrary, (coffee) => {
					expect(coffee.price).toBeGreaterThan(0);
				}),
				{ numRuns: 100 },
			);
		});

		it("property: caffeineMg is an integer between 0 and 500", () => {
			FastCheck.assert(
				FastCheck.property(CoffeeArbitrary, (coffee) => {
					expect(coffee.caffeineMg).toBeGreaterThanOrEqual(0);
					expect(coffee.caffeineMg).toBeLessThanOrEqual(500);
					expect(Number.isInteger(coffee.caffeineMg)).toBe(true);
				}),
				{ numRuns: 100 },
			);
		});
	});

	describe("sampleCoffee", () => {
		it("When called without overrides, Then returns a valid coffee", () => {
			const coffee = sampleCoffee();
			expect(() => decodeCoffee(coffee)).not.toThrow();
		});

		it("When called with overrides, Then merges overrides into the result", () => {
			const coffee = sampleCoffee({ name: "Override Brew", iced: true });
			expect(coffee.name).toBe("Override Brew");
			expect(coffee.iced).toBe(true);
		});

		it("When called with overrides, Then non-overridden fields remain valid", () => {
			const coffee = sampleCoffee({ name: "Test" });
			expect(coffee.id).toBeGreaterThan(0);
			expect(["Small", "Medium", "Large"]).toContain(coffee.size);
			expect(coffee.price).toBeGreaterThan(0);
		});
	});

	describe("sampleCoffees", () => {
		it("When called with count, Then returns that many coffees", () => {
			const coffees = sampleCoffees(10);
			expect(coffees).toHaveLength(10);
		});

		it("When called with default count, Then returns 5 coffees", () => {
			const coffees = sampleCoffees();
			expect(coffees).toHaveLength(5);
		});

		it("When called, Then all returned coffees decode against CoffeeSchema", () => {
			const coffees = sampleCoffees(20);
			for (const coffee of coffees) {
				expect(() => decodeCoffee(coffee)).not.toThrow();
			}
		});
	});
});
