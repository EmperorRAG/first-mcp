/**
 * Get-coffees service — retrieves all coffee drinks and registers the
 * corresponding MCP tool.
 *
 * @remarks
 * Exports two symbols:
 *
 * | Export | Role |
 * |--------|------|
 * | {@link GetCoffeesService} | Effect service with `execute` and `executeFormatted` |
 * | {@link registerGetCoffeesTool} | Wires the service to the MCP SDK via `registerTool` |
 *
 * The service depends on {@link CoffeeRepository} through Effect’s DI
 * and never fails (error channel is `never`).
 *
 * @module
 */
import { Effect } from "effect";
import { CoffeeRepository } from "../../repository/coffee-repository.js";

/**
 * Effect service for retrieving all coffee drinks from the repository.
 *
 * @remarks
 * Created via {@link Effect.Service} with an `effect` factory that
 * resolves {@link CoffeeRepository} from the DI context.  The
 * `dependencies` array bundles {@link CoffeeRepository.Default} so
 * that `GetCoffeesService.Default` is fully self-contained.  Exposes
 * two accessors:
 *
 * - **`execute`** — returns `Effect<ReadonlyArray<Coffee>>` via
 *   `CoffeeRepository.findAll`.
 * - **`executeFormatted`** — accepts `unknown` args (ignored for this
 *   tool) and wraps `execute` to produce an MCP-compatible
 *   `{ content: [{ type: "text", text }] }` response by
 *   JSON-serializing the full array.  Satisfies the
 *   {@link RegisterableTool} interface.
 * - **`metaData`** — static object with `name` (`"get-coffees"`) and
 *   `description` (`"Get a list of all coffees"`) for MCP tool
 *   registration.
 *
 * Both accessors attach an OpenTelemetry span via `Effect.withSpan`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { GetCoffeesService } from "./get-coffees.service.js";
 *
 * const allCoffees = Effect.gen(function* () {
 *   const svc = yield* GetCoffeesService;
 *   return yield* svc.execute;
 * });
 * ```
 */
export class GetCoffeesService extends Effect.Service<GetCoffeesService>()(
	"GetCoffeesService",
	{
		effect: Effect.gen(function* () {
			const repo = yield* CoffeeRepository;
			const execute = repo.findAll.pipe(
				Effect.withSpan("GetCoffeesService.execute"),
			);
			return {
				execute,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				executeFormatted: (_args: unknown): Effect.Effect<{ [key: string]: unknown; content: { type: "text"; text: string }[] }> =>
					execute.pipe(
						Effect.map((coffees) => ({
							content: [{ type: "text" as const, text: JSON.stringify(coffees) }],
						})),
						Effect.withSpan("GetCoffeesService.executeFormatted"),
					),
				metaData: {
					name: "get-coffees" as const,
					description: "Get a list of all coffees" as const,
				},
			};
		}),
		dependencies: [CoffeeRepository.Default],
	},
) { }
