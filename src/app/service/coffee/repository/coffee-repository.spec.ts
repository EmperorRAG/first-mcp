/**
 * Unit tests for the {@link CoffeeRepository} service and its default
 * in-memory implementation.
 *
 * @remarks
 * Each test exercises the repository through the Effect dependency
 * injection system by providing {@link CoffeeRepository.Default} via
 * the {@link runWithRepo} helper.  This verifies both the service
 * contract and the static in-memory catalog contents.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, Option } from "effect";
import {
	CoffeeRepository,
} from "./coffee-repository.js";

/**
 * Convenience runner that provides
 * {@link CoffeeRepository.Default} and executes the given
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
	Effect.runPromise(Effect.provide(effect, CoffeeRepository.Default));

/**
 * Exercises the {@link CoffeeRepository} service contract and its
 * default in-memory catalog data.
 */
describe("CoffeeRepository", () => {
	/**
	 * Verifies that {@link CoffeeRepository.findAll} returns the
	 * complete seed catalog of four coffee drinks.
	 */
	it("findAll returns all four coffees", async () => {
		/**
		 * All coffee drinks resolved from the in-memory catalog via
		 * {@link CoffeeRepository.findAll}.
		 *
		 * @internal
		 */
		const coffees = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findAll;
			}),
		);
		expect(coffees).toHaveLength(4);
		expect(coffees.map((c) => c.name)).toContain("Flat White");
	});

	/**
	 * Verifies that {@link CoffeeRepository.findByName} returns
	 * `Some<Coffee>` when the name matches a catalog entry.
	 */
	it("findByName returns the matching coffee", async () => {
		/**
		 * Lookup result for `"Espresso"` — expected to be
		 * `Some<Coffee>` wrapping the matching catalog entry.
		 *
		 * @internal
		 */
		const result = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("Espresso");
			}),
		);
		expect(Option.isSome(result)).toBe(true);
		expect(Option.getOrThrow(result).name).toBe("Espresso");
	});

	/**
	 * Verifies that {@link CoffeeRepository.findByName} returns
	 * `None` when the name does not match any catalog entry.
	 */
	it("findByName returns None for unknown name", async () => {
		/**
		 * Lookup result for `"nonexistent"` — expected to be `None`
		 * since no catalog entry has that name.
		 *
		 * @internal
		 */
		const result = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("nonexistent");
			}),
		);
		expect(Option.isNone(result)).toBe(true);
	});

	/**
	 * Verifies that {@link CoffeeRepository.findByName} performs an
	 * exact case-sensitive match — `"espresso"` (lowercase) must not
	 * resolve the `"Espresso"` catalog entry.
	 */
	it("findByName is case-sensitive", async () => {
		/**
		 * Lookup result for `"espresso"` (lowercase) — expected to be
		 * `None` because the catalog stores `"Espresso"` with a
		 * capital `E`.
		 *
		 * @internal
		 */
		const result = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("espresso");
			}),
		);
		expect(Option.isNone(result)).toBe(true);
	});

	/**
	 * Verifies that {@link CoffeeRepository.findByName} returns
	 * `None` for the degenerate empty-string input rather than
	 * matching any entry or throwing.
	 */
	it("findByName returns None for empty string", async () => {
		/**
		 * Lookup result for `""` — expected to be `None` since no
		 * catalog entry has an empty name.
		 *
		 * @internal
		 */
		const result = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findByName("");
			}),
		);
		expect(Option.isNone(result)).toBe(true);
	});

	/**
	 * Verifies that each {@link Coffee} entry returned by
	 * {@link CoffeeRepository.findAll} conforms to the expected
	 * entity shape with all six schema fields present and
	 * correctly typed.
	 */
	it("findAll returns coffees with expected shape", async () => {
		/**
		 * All coffee drinks resolved from the in-memory catalog via
		 * {@link CoffeeRepository.findAll}.
		 *
		 * @internal
		 */
		const coffees = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findAll;
			}),
		);
		/**
		 * First coffee drink in the catalog, used as the shape
		 * verification target.
		 *
		 * @internal
		 */
		const coffee = coffees[0];
		expect(coffee).toBeDefined();
		expect(typeof coffee.id).toBe("number");
		expect(typeof coffee.name).toBe("string");
		expect(typeof coffee.size).toBe("string");
		expect(typeof coffee.price).toBe("number");
		expect(typeof coffee.iced).toBe("boolean");
		expect(typeof coffee.caffeineMg).toBe("number");
	});

	/**
	 * Verifies that {@link CoffeeRepository.findAll} returns
	 * exactly the four expected coffee names — guards against
	 * accidental additions or removals in the static catalog.
	 */
	it("findAll returns all known coffee names", async () => {
		/**
		 * All coffee drinks resolved from the in-memory catalog via
		 * {@link CoffeeRepository.findAll}.
		 *
		 * @internal
		 */
		const coffees = await runWithRepo(
			Effect.gen(function* () {
				/**
				 * Repository handle yielded from the
				 * {@link CoffeeRepository} service tag.
				 *
				 * @internal
				 */
				const repo = yield* CoffeeRepository;
				return yield* repo.findAll;
			}),
		);
		/**
		 * Extracted names from the catalog for set-equality
		 * comparison against the known coffee names.
		 *
		 * @internal
		 */
		const names = coffees.map((c) => c.name);
		expect(names).toEqual(
			expect.arrayContaining(["Flat White", "Cappuccino", "Latte", "Espresso"]),
		);
		expect(names).toHaveLength(4);
	});

	/**
	 * Verifies that {@link CoffeeRepository.findByName} returns
	 * the correct entity data for every entry in the static
	 * catalog — guards against field-level data corruption.
	 */
	it("findByName returns correct entity data for each catalog entry", async () => {
		/**
		 * Expected catalog data keyed by coffee name, used to
		 * verify each entry returned by
		 * {@link CoffeeRepository.findByName}.
		 *
		 * @internal
		 */
		const expected = [
			{ name: "Flat White", size: "Medium", price: 4.5, iced: false, caffeineMg: 130 },
			{ name: "Cappuccino", size: "Small", price: 3.75, iced: false, caffeineMg: 80 },
			{ name: "Latte", size: "Large", price: 5.25, iced: true, caffeineMg: 150 },
			{ name: "Espresso", size: "Small", price: 2.5, iced: false, caffeineMg: 64 },
		];

		for (const entry of expected) {
			/**
			 * Lookup result for the current catalog entry name —
			 * expected to be `Some<Coffee>` with matching fields.
			 *
			 * @internal
			 */
			const result = await runWithRepo(
				Effect.gen(function* () {
					/**
					 * Repository handle yielded from the
					 * {@link CoffeeRepository} service tag.
					 *
					 * @internal
					 */
					const repo = yield* CoffeeRepository;
					return yield* repo.findByName(entry.name);
				}),
			);
			expect(Option.isSome(result)).toBe(true);
			expect(Option.getOrThrow(result)).toMatchObject(entry);
		}
	});
});
