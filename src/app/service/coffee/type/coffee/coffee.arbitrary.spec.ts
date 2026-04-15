/**
 * Unit tests for the {@link CoffeeArbitrary} and its convenience
 * helpers ({@link sampleCoffee}, {@link sampleCoffees}).
 *
 * @remarks
 * Validates that Faker-annotated arbitrary generation produces
 * values conforming to {@link CoffeeSchema} constraints.  Uses
 * `it.prop` (from `@effect/vitest`) for property-based tests,
 * deriving the arbitrary directly from {@link CoffeeSchema}, and
 * `it.effect` for deterministic helper tests:
 *
 * - Schema decode round-trip on sampled data.
 * - Per-field constraint validation (positive id, non-empty name,
 *   literal size, positive price, caffeineMg 0–500).
 * - Override merging via {@link sampleCoffee}.
 * - Batch generation via {@link sampleCoffees}.
 *
 * @module
 */
import { describe, it, expect } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { CoffeeSchema } from "./coffee.type.js";
import { sampleCoffee, sampleCoffees } from "./coffee.arbitrary.js";

/** @internal */
const decodeCoffee = Schema.decodeUnknownSync(CoffeeSchema);

describe("CoffeeArbitrary", () => {
	describe("When sampling coffees, Then all values conform to CoffeeSchema", () => {
		it.prop(
			"property: 100 samples decode successfully against CoffeeSchema",
			{ coffee: CoffeeSchema },
			({ coffee }) => {
				expect(() => decodeCoffee(coffee)).not.toThrow();
			},
			{ fastCheck: { numRuns: 100 } },
		);

		it.prop(
			"property: id is a positive integer",
			{ coffee: CoffeeSchema },
			({ coffee }) => {
				expect(coffee.id).toBeGreaterThan(0);
				expect(Number.isInteger(coffee.id)).toBe(true);
			},
			{ fastCheck: { numRuns: 100 } },
		);

		it.prop(
			"property: name is a non-empty string",
			{ coffee: CoffeeSchema },
			({ coffee }) => {
				expect(typeof coffee.name).toBe("string");
				expect(coffee.name.length).toBeGreaterThan(0);
			},
			{ fastCheck: { numRuns: 100 } },
		);

		it.prop(
			"property: size is one of Small, Medium, or Large",
			{ coffee: CoffeeSchema },
			({ coffee }) => {
				expect(["Small", "Medium", "Large"]).toContain(coffee.size);
			},
			{ fastCheck: { numRuns: 100 } },
		);

		it.prop(
			"property: price is a positive number",
			{ coffee: CoffeeSchema },
			({ coffee }) => {
				expect(coffee.price).toBeGreaterThan(0);
			},
			{ fastCheck: { numRuns: 100 } },
		);

		it.prop(
			"property: caffeineMg is an integer between 0 and 500",
			{ coffee: CoffeeSchema },
			({ coffee }) => {
				expect(coffee.caffeineMg).toBeGreaterThanOrEqual(0);
				expect(coffee.caffeineMg).toBeLessThanOrEqual(500);
				expect(Number.isInteger(coffee.caffeineMg)).toBe(true);
			},
			{ fastCheck: { numRuns: 100 } },
		);
	});

	describe("sampleCoffee", () => {
		it.effect(
			"When called without overrides, Then returns a valid coffee",
			() =>
				Effect.sync(() => {
					const coffee = sampleCoffee();
					expect(() => decodeCoffee(coffee)).not.toThrow();
				}),
		);

		it.effect(
			"When called with overrides, Then merges overrides into the result",
			() =>
				Effect.sync(() => {
					const coffee = sampleCoffee({
						name: "Override Brew",
						iced: true,
					});
					expect(coffee.name).toBe("Override Brew");
					expect(coffee.iced).toBe(true);
				}),
		);

		it.effect(
			"When called with overrides, Then non-overridden fields remain valid",
			() =>
				Effect.sync(() => {
					const coffee = sampleCoffee({ name: "Test" });
					expect(coffee.id).toBeGreaterThan(0);
					expect(["Small", "Medium", "Large"]).toContain(coffee.size);
					expect(coffee.price).toBeGreaterThan(0);
				}),
		);
	});

	describe("sampleCoffees", () => {
		it.effect(
			"When called with count, Then returns that many coffees",
			() =>
				Effect.sync(() => {
					const coffees = sampleCoffees(10);
					expect(coffees).toHaveLength(10);
				}),
		);

		it.effect(
			"When called with default count, Then returns 5 coffees",
			() =>
				Effect.sync(() => {
					const coffees = sampleCoffees();
					expect(coffees).toHaveLength(5);
				}),
		);

		it.effect(
			"When called, Then all returned coffees decode against CoffeeSchema",
			() =>
				Effect.sync(() => {
					const coffees = sampleCoffees(20);
					for (const coffee of coffees) {
						expect(() => decodeCoffee(coffee)).not.toThrow();
					}
				}),
		);
	});
});
