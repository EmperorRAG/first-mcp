/**
 * Coffee domain — Effect service that exposes each coffee tool as a
 * named executor function bound to the resolved {@link RepositoryTag}.
 *
 * @remarks
 * This module is the domain barrel for the coffee bounded context.
 * {@link CoffeeService} is an {@link Effect.Service} whose `effect`
 * factory yields {@link RepositoryTag} and binds the get-coffees and
 * get-a-coffee functions to that repository so the resulting
 * executor closures carry no requirements channel.
 *
 * Tool metadata, input schemas, and MCP server registration are
 * owned by `service/mcp/register-coffee-tools/register-coffee-tools.ts`.
 *
 * @module
 */
import { Effect } from "effect";
import { RepositoryTag } from "../../repository/repository.js";
import { InMemoryCoffeeRepositoryLive } from "./shared/repository/coffee/in-memory/repository.live.js";
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
 * The `dependencies` array bundles
 * {@link InMemoryCoffeeRepositoryLive} so the domain can be
 * provided with a single `CoffeeService.Default`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { CoffeeService } from "./coffee.service.js";
 *
 * const program = Effect.gen(function* () {
 *   const domain = yield* CoffeeService;
 *   const result = yield* domain.getCoffees(undefined);
 *   console.log(result);
 * });
 * ```
 */
export class CoffeeService extends Effect.Service<CoffeeService>()(
	"CoffeeService",
	{
		effect: Effect.gen(function* () {
			const repo = yield* RepositoryTag;

			return {
				getCoffees: (args: unknown) =>
					getCoffees(args).pipe(
						Effect.provideService(RepositoryTag, repo),
					),
				getACoffee: (args: unknown) =>
					getACoffee(args).pipe(
						Effect.provideService(RepositoryTag, repo),
					),
			};
		}),
		dependencies: [InMemoryCoffeeRepositoryLive],
	},
) { }