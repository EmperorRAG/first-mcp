/**
 * Unit tests for the {@link RepositoryTag} service contract as
 * supplied by {@link InMemoryCoffeeRepositoryLive}.
 *
 * @remarks
 * Each test exercises the repository through the Effect dependency
 * injection system.  The {@link layer} helper from `@effect/vitest`
 * provides {@link InMemoryCoffeeRepositoryLive} to every
 * {@link it.effect} block, so individual tests yield the service
 * directly without manual wiring.
 *
 * @module
 */
import { expect, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { RepositoryTag } from "../../../../../../repository/repository.js";
import { InMemoryCoffeeRepositoryLive } from "./repository.live.js";

/**
 * Exercises the {@link RepositoryTag} service contract and the
 * default in-memory catalog data supplied by
 * {@link InMemoryCoffeeRepositoryLive}.
 */
layer(InMemoryCoffeeRepositoryLive)("Repository (in-memory coffee)", (it) => {
	/**
	 * Verifies that {@link RepositoryTag.findAll} returns the
	 * complete seed catalog of four coffee drinks.
	 */
	it.effect("findAll returns all four coffees", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * All coffee drinks resolved from the in-memory catalog
			 * via {@link RepositoryTag.findAll}.
			 *
			 * @internal
			 */
			const coffees = yield* repo.findAll(undefined);

			expect(coffees).toHaveLength(4);
			expect(coffees.map((c) => c.name)).toContain("Flat White");
		}),
	);

	/**
	 * Verifies that {@link Repository.findByName} returns
	 * `Some<Coffee>` when the name matches a catalog entry.
	 */
	it.effect("findByName returns the matching coffee", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * Lookup result for `"Espresso"` — expected to be
			 * `Some<Coffee>` wrapping the matching catalog entry.
			 *
			 * @internal
			 */
			const result = yield* repo.findByName("Espresso");

			Option.match(result, {
				onNone: () => expect.fail("expected Some<Coffee>"),
				onSome: (coffee) => expect(coffee.name).toBe("Espresso"),
			});
		}),
	);

	/**
	 * Verifies that {@link Repository.findByName} returns
	 * `None` when the name does not match any catalog entry.
	 */
	it.effect("findByName returns None for unknown name", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * Lookup result for `"nonexistent"` — expected to be
			 * `None` since no catalog entry has that name.
			 *
			 * @internal
			 */
			const result = yield* repo.findByName("nonexistent");

			Option.match(result, {
				onNone: () => undefined,
				onSome: () => expect.fail("expected None"),
			});
		}),
	);

	/**
	 * Verifies that {@link Repository.findByName} performs an
	 * exact case-sensitive match — `"espresso"` (lowercase) must not
	 * resolve the `"Espresso"` catalog entry.
	 */
	it.effect("findByName is case-sensitive", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * Lookup result for `"espresso"` (lowercase) — expected
			 * to be `None` because the catalog stores `"Espresso"`
			 * with a capital `E`.
			 *
			 * @internal
			 */
			const result = yield* repo.findByName("espresso");

			Option.match(result, {
				onNone: () => undefined,
				onSome: () => expect.fail("expected None"),
			});
		}),
	);

	/**
	 * Verifies that {@link Repository.findByName} returns
	 * `None` for the degenerate empty-string input rather than
	 * matching any entry or throwing.
	 */
	it.effect("findByName returns None for empty string", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * Lookup result for `""` — expected to be `None` since
			 * no catalog entry has an empty name.
			 *
			 * @internal
			 */
			const result = yield* repo.findByName("");

			Option.match(result, {
				onNone: () => undefined,
				onSome: () => expect.fail("expected None"),
			});
		}),
	);

	/**
	 * Verifies that each {@link Coffee} entry returned by
	 * {@link RepositoryTag.findAll} conforms to the expected
	 * entity shape with all six schema fields present and
	 * correctly typed.
	 */
	it.effect("findAll returns coffees with expected shape", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * All coffee drinks resolved from the in-memory catalog
			 * via {@link RepositoryTag.findAll}.
			 *
			 * @internal
			 */
			const coffees = yield* repo.findAll(undefined);

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
		}),
	);

	/**
	 * Verifies that {@link RepositoryTag.findAll} returns
	 * exactly the four expected coffee names — guards against
	 * accidental additions or removals in the static catalog.
	 */
	it.effect("findAll returns all known coffee names", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * All coffee drinks resolved from the in-memory catalog
			 * via {@link RepositoryTag.findAll}.
			 *
			 * @internal
			 */
			const coffees = yield* repo.findAll(undefined);

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
		}),
	);

	/**
	 * Verifies that {@link Repository.findByName} returns
	 * the correct entity data for every entry in the static
	 * catalog — guards against field-level data corruption.
	 */
	it.effect("findByName returns correct entity data for each catalog entry", () =>
		Effect.gen(function* () {
			/**
			 * Repository handle yielded from the
			 * {@link RepositoryTag} service tag.
			 *
			 * @internal
			 */
			const repo = yield* RepositoryTag;

			/**
			 * Expected catalog data keyed by coffee name, used to
			 * verify each entry returned by
			 * {@link Repository.findByName}.
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
				const result = yield* repo.findByName(entry.name);

				Option.match(result, {
					onNone: () => expect.fail(`expected Some<Coffee> for "${entry.name}"`),
					onSome: (coffee) => expect(coffee).toMatchObject(entry),
				});
			}
		}),
	);
});
