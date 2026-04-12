/**
 * Unit tests for Effect-based `CoffeeRepository` and `InMemoryCoffeeRepository`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import {
	CoffeeRepository,
	InMemoryCoffeeRepository,
} from "./coffee-repository.js";

const runWithRepo = <A>(effect: Effect.Effect<A, never, CoffeeRepository>) =>
	Effect.runPromise(Effect.provide(effect, InMemoryCoffeeRepository));

describe("InMemoryCoffeeRepository", () => {
	it("findAll returns all four coffees", async () => {
		const coffees = await runWithRepo(
			Effect.gen(function* () {
				const repo = yield* CoffeeRepository;
				return yield* repo.findAll;
			}),
		);
		expect(coffees).toHaveLength(4);
		expect(coffees.map((c) => c.name)).toContain("Flat White");
	});

	it("findByName returns the matching coffee", async () => {
		const coffee = await runWithRepo(
			Effect.gen(function* () {
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("Espresso");
			}),
		);
		expect(coffee).toBeDefined();
		expect(coffee!.name).toBe("Espresso");
	});

	it("findByName returns undefined for unknown name", async () => {
		const coffee = await runWithRepo(
			Effect.gen(function* () {
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("nonexistent");
			}),
		);
		expect(coffee).toBeUndefined();
	});
});
