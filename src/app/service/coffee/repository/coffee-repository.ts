/**
 * Coffee repository — Effect {@link Context.Tag} service definition and
 * {@link InMemoryCoffeeRepository | in-memory} implementation.
 *
 * @remarks
 * This module defines the data-access contract
 * ({@link CoffeeRepositoryShape}) for coffee drink persistence and
 * provides a concrete {@link Layer} backed by a static in-memory array
 * ({@link coffeeDrinks}).  The repository interface is designed to be
 * swap-friendly: replacing the in-memory layer with a database-backed
 * implementation requires only a new {@link Layer} — consuming code
 * remains unchanged because it depends solely on the
 * {@link CoffeeRepository} tag.
 *
 * @module
 */
import { Context, Effect, Layer, Option } from "effect";
import type { Coffee } from "../types.js";

/**
 * Data-access contract for {@link Coffee} drink persistence.
 *
 * @remarks
 * Every method returns an {@link Effect.Effect} rather than a raw value so
 * that implementations can be synchronous (in-memory) or asynchronous
 * (database) without changing the interface.  The contract exposes two
 * operations:
 *
 * - **`findAll`** — Retrieves the full catalog of coffee drinks.
 * - **`findByName`** — Looks up a single drink by exact name, returning
 *   an {@link Option.Option} to represent the not-found case without
 *   throwing.
 */
export interface CoffeeRepositoryShape {
	/** Returns every {@link Coffee} in the catalog. */
	readonly findAll: Effect.Effect<Coffee[]>;
	/**
	 * Finds a single {@link Coffee} by exact `name` match.
	 *
	 * @param name - Case-sensitive coffee name to search for.
	 * @returns An {@link Effect.Effect} yielding `Some<Coffee>` when found,
	 *          or `None` when no drink matches.
	 */
	readonly findByName: (name: string) => Effect.Effect<Option.Option<Coffee>>;
}

/**
 * Effect {@link Context.Tag} that identifies the
 * {@link CoffeeRepositoryShape} service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"CoffeeRepository"`.  Consumer
 * code yields this tag inside an {@link Effect.gen} block to obtain the
 * repository implementation provided by the current {@link Layer}
 * (e.g. {@link InMemoryCoffeeRepository}).
 *
 * @example
 * ```ts
 * const program = Effect.gen(function* () {
 *   const repo = yield* CoffeeRepository;
 *   const coffees = yield* repo.findAll;
 * });
 * ```
 */
export class CoffeeRepository extends Context.Tag("CoffeeRepository")<
	CoffeeRepository,
	CoffeeRepositoryShape
>() { }

/**
 * Static catalog of {@link Coffee} drinks used by the
 * {@link InMemoryCoffeeRepository}.
 *
 * @remarks
 * Contains four entries (Flat White, Cappuccino, Latte, Espresso) with
 * representative values for `size`, `price`, `iced`, and `caffeineMg`.
 * The array is defined at module scope so it is shared across all
 * repository method invocations without re-allocation.
 *
 * @internal
 */
const coffeeDrinks: Coffee[] = [
	{
		id: 1,
		name: "Flat White",
		size: "Medium",
		price: 4.5,
		iced: false,
		caffeineMg: 130,
	},
	{
		id: 2,
		name: "Cappuccino",
		size: "Small",
		price: 3.75,
		iced: false,
		caffeineMg: 80,
	},
	{
		id: 3,
		name: "Latte",
		size: "Large",
		price: 5.25,
		iced: true,
		caffeineMg: 150,
	},
	{
		id: 4,
		name: "Espresso",
		size: "Small",
		price: 2.5,
		iced: false,
		caffeineMg: 64,
	},
];

/**
 * {@link Layer} providing an in-memory {@link CoffeeRepositoryShape}
 * implementation backed by the static {@link coffeeDrinks} array.
 *
 * @remarks
 * Both operations delegate to {@link Effect.sync} for synchronous
 * evaluation and are wrapped in {@link Effect.withSpan} for
 * observability tracing:
 *
 * - **`findAll`** — Returns the entire {@link coffeeDrinks} array.
 * - **`findByName`** — Performs a linear `Array.find` by exact name,
 *   wrapping the result in {@link Option.fromNullable} so that a missing
 *   entry yields `None` rather than `undefined`.
 *
 * Provide this layer in production, development, or test environments
 * where a real database is not required.
 *
 * @example
 * ```ts
 * const program = Effect.gen(function* () {
 *   const repo = yield* CoffeeRepository;
 *   return yield* repo.findAll;
 * });
 *
 * await Effect.runPromise(
 *   Effect.provide(program, InMemoryCoffeeRepository),
 * );
 * ```
 */
export const InMemoryCoffeeRepository = Layer.succeed(CoffeeRepository, {
	findAll: Effect.sync(() => coffeeDrinks).pipe(
		Effect.withSpan("CoffeeRepository.findAll"),
	),
	findByName: (name: string) =>
		Effect.sync(() => Option.fromNullable(coffeeDrinks.find((c) => c.name === name))).pipe(
			Effect.withSpan("CoffeeRepository.findByName", { attributes: { name } }),
		),
});
