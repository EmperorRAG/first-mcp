/**
 * In-memory implementation of the {@link RepositoryTag} {@link Layer}
 * for the coffee domain.
 *
 * @remarks
 * Exports {@link InMemoryCoffeeRepositoryLive} — a {@link Layer}
 * built with {@link Layer.succeed} that supplies the {@link RepositoryTag}
 * with concrete `findAll` / `findByName` implementations backed
 * by the static {@link coffeeDrinks} catalog.
 *
 * Both operations are synchronous (`Effect.sync`) and wrapped in
 * {@link Effect.withSpan} for observability tracing.  Consumers
 * remain unchanged when this layer is swapped for an alternative
 * (e.g. database-backed) implementation that satisfies the same
 * {@link RepositoryTag} shape.
 *
 * @module
 */
import { Effect, Layer, Option } from "effect";
import { RepositoryTag } from "../../../../../../repository/repository.js";
import type { Coffee } from "../../../type/coffee/coffee.type.js";

/**
 * Static catalog of {@link Coffee} drinks used by the
 * {@link InMemoryCoffeeRepositoryLive} layer.
 *
 * @remarks
 * Contains four entries (Flat White, Cappuccino, Latte, Espresso)
 * with representative values for `size`, `price`, `iced`, and
 * `caffeineMg`.  Defined at module scope so it is shared across
 * all repository method invocations without re-allocation.
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
 * {@link Layer} providing the {@link RepositoryTag} with an
 * in-memory implementation backed by {@link coffeeDrinks}.
 *
 * @remarks
 * Use this layer to wire the coffee domain in production and tests:
 *
 * - **`findAll`** — Returns the entire {@link coffeeDrinks} array
 *   inside `Effect.sync`, traced by the span
 *   `"Repository.findAll"`.  Accepts an unused `_args` argument so
 *   the signature mirrors other tool executors.
 * - **`findByName`** — Performs a linear `Array.find` by exact name
 *   wrapped in {@link Option.fromNullable} so a miss yields `None`,
 *   traced by the span `"Repository.findByName"` with the queried
 *   name as a span attribute.
 *
 * Swap to a database-backed implementation by providing an
 * alternative layer for {@link RepositoryTag} — consuming code
 * remains unchanged.
 *
 * @example
 * ```ts
 * const program = Effect.gen(function* () {
 *   const repo = yield* RepositoryTag;
 *   return yield* repo.findAll(undefined);
 * });
 *
 * await Effect.runPromise(
 *   Effect.provide(program, InMemoryCoffeeRepositoryLive),
 * );
 * ```
 */
export const InMemoryCoffeeRepositoryLive = Layer.succeed(RepositoryTag, {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	findAll: (_args: unknown) =>
		Effect.sync(() => coffeeDrinks).pipe(
			Effect.withSpan("Repository.findAll"),
		),
	findByName: (name: string) =>
		Effect.sync(() =>
			Option.fromNullable(coffeeDrinks.find((c) => c.name === name)),
		).pipe(
			Effect.withSpan("Repository.findByName", { attributes: { name } }),
		),
});
