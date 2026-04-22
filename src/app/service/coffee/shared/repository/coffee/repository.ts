/**
 * Coffee repository — {@link Effect.Service} definition with a default
 * in-memory implementation backed by a static {@link Coffee} catalog.
 *
 * @remarks
 * This module exposes the {@link CoffeeRepository} service via
 * {@link Effect.Service} with a `succeed` constructor key.  The
 * default implementation ({@link CoffeeRepository.Default}) stores
 * coffee drinks in a static in-memory array ({@link coffeeDrinks}).
 * The service is swap-friendly: provide an alternative {@link Layer}
 * (e.g. database-backed) and consuming code remains unchanged because
 * it depends solely on the {@link CoffeeRepository} tag.
 *
 * @module
 */
import { Effect, Option } from "effect";
import type { Coffee } from "../../type/coffee/coffee.type.js";

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
 * {@link Effect.Service} providing data access for {@link Coffee} drink
 * persistence with a default in-memory implementation.
 *
 * @remarks
 * The `succeed` constructor provides a static implementation backed by
 * the {@link coffeeDrinks} array.  Both operations delegate to
 * {@link Effect.sync} for synchronous evaluation and are wrapped in
 * {@link Effect.withSpan} for observability tracing:
 *
 * - **`findAll`** — Returns the entire {@link coffeeDrinks} array.
 * - **`findByName`** — Performs a linear `Array.find` by exact name,
 *   wrapping the result in {@link Option.fromNullable} so that a missing
 *   entry yields `None` rather than `undefined`.
 *
 * Use `CoffeeRepository.Default` as the production/test {@link Layer}.
 * Swap to a database-backed implementation by providing an alternative
 * layer — consuming code remains unchanged.
 *
 * @example
 * ```ts
 * const program = Effect.gen(function* () {
 *   const repo = yield* CoffeeRepository;
 *   return yield* repo.findAll;
 * });
 *
 * await Effect.runPromise(
 *   Effect.provide(program, CoffeeRepository.Default),
 * );
 * ```
 */
export class CoffeeRepository extends Effect.Service<CoffeeRepository>()(
	"CoffeeRepository",
	{
		succeed: {
			findAll: Effect.sync(() => coffeeDrinks).pipe(
				Effect.withSpan("CoffeeRepository.findAll"),
			),
			findByName: (name: string) =>
				Effect.sync(() => Option.fromNullable(coffeeDrinks.find((c) => c.name === name))).pipe(
					Effect.withSpan("CoffeeRepository.findByName", { attributes: { name } }),
				),
		},
	},
) { }
