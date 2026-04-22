/**
 * Coffee domain — Effect service that exposes each coffee tool as a
 * named executor function bound to the resolved
 * {@link CoffeeRepository}.
 *
 * @remarks
 * This module is the domain barrel for the coffee bounded context.
 * {@link CoffeeDomain} is an {@link Effect.Service} whose `effect`
 * factory yields {@link CoffeeRepository} and binds the get-coffees
 * and get-a-coffee functions to that repository so the resulting
 * executor closures carry no requirements channel.
 *
 * Tool metadata, input schemas, and MCP server registration are
 * owned by `service/mcp/register-coffee-tools/register-coffee-tools.ts`.
 *
 * @module
 */
import { Effect } from "effect";
import { CoffeeRepository } from "./shared/repository/coffee/repository.js";
import { getCoffees } from "./get-coffees/get-coffees.js";
import { getACoffee } from "./get-a-coffee/get-a-coffee.js";

/**
 * Effect service exposing coffee domain tools as named executor
 * properties.
 *
 * @remarks
 * Each property (`getCoffees`, `getACoffee`) is a bare executor
 * function `(args: unknown) => Effect<...>`.  Tool metadata,
 * input-schema references, and MCP `registerTool` wiring live in
 * `service/mcp/register-coffee-tools/`.
 *
 * The `dependencies` array bundles {@link CoffeeRepository.Default}
 * so the domain can be provided with a single `CoffeeDomain.Default`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { CoffeeDomain } from "./coffee.service.js";
 *
 * const program = Effect.gen(function* () {
 *   const domain = yield* CoffeeDomain;
 *   const result = yield* domain.getCoffees(undefined);
 *   console.log(result);
 * });
 * ```
 */
export class CoffeeDomain extends Effect.Service<CoffeeDomain>()(
	"CoffeeDomain",
	{
		effect: Effect.gen(function* () {
			const repo = yield* CoffeeRepository;

			return {
				getCoffees: (args: unknown) =>
					getCoffees(args).pipe(
						Effect.provideService(CoffeeRepository, repo),
					),
				getACoffee: (args: unknown) =>
					getACoffee(args).pipe(
						Effect.provideService(CoffeeRepository, repo),
					),
			};
		}),
		dependencies: [CoffeeRepository.Default],
	},
) { }