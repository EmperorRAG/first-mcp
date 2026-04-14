/**
 * Unit tests for the {@link CoffeeRepository} tag and its
 * {@link InMemoryCoffeeRepository} implementation.
 *
 * @remarks
 * Each test exercises the repository through the Effect dependency
 * injection system by providing {@link InMemoryCoffeeRepository} via
 * the {@link runWithRepo} helper.  This verifies both the
 * `CoffeeRepositoryShape` contract and the static
 * in-memory catalog contents.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, Option } from "effect";
import {
	CoffeeRepository,
	InMemoryCoffeeRepository,
} from "./coffee-repository.js";

/**
 * Convenience runner that provides the
 * {@link InMemoryCoffeeRepository} layer and executes the given
 * effect as a `Promise`.
 *
 * @remarks
 * Wraps the two-step pattern of `Effect.provide` +
 * `Effect.runPromise` into a single call so that each `it` block
 * stays focused on the assertion rather than Effect wiring.
 *
 * @typeParam A - The success type of the effect under test.
 * @param effect - An {@link Effect.Effect} requiring
 *        {@link CoffeeRepository} in its environment.
 * @returns A `Promise` resolving with the effect's success value.
 *
 * @internal
 */
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
		const result = await runWithRepo(
			Effect.gen(function* () {
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("Espresso");
			}),
		);
		expect(Option.isSome(result)).toBe(true);
		expect(Option.getOrThrow(result).name).toBe("Espresso");
	});

	it("findByName returns None for unknown name", async () => {
		const result = await runWithRepo(
			Effect.gen(function* () {
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("nonexistent");
			}),
		);
		expect(Option.isNone(result)).toBe(true);
	});
});
