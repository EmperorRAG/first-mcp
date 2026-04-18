/**
 * Get-a-coffee service — retrieves a single coffee by name and
 * registers the corresponding MCP tool.
 *
 * @remarks
 * Exports two symbols:
 *
 * | Export | Role |
 * |--------|------|
 * | {@link GetACoffeeService} | Effect service with `execute` and `executeFormatted` methods |
 * | {@link registerGetACoffeeTool} | Wires the service to the MCP SDK via `registerTool` |
 *
 * The service depends on {@link CoffeeRepository} through Effect’s DI
 * and fails with {@link CoffeeNotFoundError} when no match exists.
 *
 * @module
 */
import { Effect, Option, Schema } from "effect";
import { CoffeeRepository } from "../../repository/coffee-repository.js";
import type { Coffee } from "../../type/coffee/coffee.type.js";
import { CoffeeNotFoundError } from "../../errors.js";
import { GetACoffeeInput, GetACoffeeInputStandard } from "./get-a-coffee.schema.js";
import type { ToolResponse } from "../../../../server/mcp/registerable-tool.js";

/**
 * Effect service for retrieving a single coffee drink by name.
 *
 * @remarks
 * Created via {@link Effect.Service} with an `effect` factory that
 * resolves {@link CoffeeRepository} from the DI context.  The
 * `dependencies` array bundles {@link CoffeeRepository.Default} so
 * that `GetACoffeeService.Default` is fully self-contained.  Exposes
 * two methods:
 *
 * - **`execute(name)`** — returns `Effect<Coffee, CoffeeNotFoundError>`.
 *   Looks up the coffee in the repository via
 *   `CoffeeRepository.findByName` and fails with
 *   {@link CoffeeNotFoundError} when {@link Option.isNone} is true.
 * - **`executeFormatted(args)`** — accepts raw `unknown` args,
 *   decodes internally via {@link Schema.decodeUnknownSync} against
 *   {@link GetACoffeeInput}, then wraps `execute` to produce an
 *   MCP-compatible `{ content: [{ type: "text", text }] }` response,
 *   catching {@link CoffeeNotFoundError} internally and returning a
 *   user-friendly message instead of propagating the error.
 *   Satisfies the {@link RegisterableTool} interface.
 * - **`metaData`** — static object with `name` (`"get-a-coffee"`)
 *   and `description` for MCP tool registration.
 * - **`inputSchema`** — {@link GetACoffeeInputStandard} adapter
 *   for MCP SDK input validation.
 *
 * Both methods attach an OpenTelemetry span via `Effect.withSpan`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { GetACoffeeService } from "./get-a-coffee.service.js";
 *
 * const coffee = Effect.gen(function* () {
 *   const svc = yield* GetACoffeeService;
 *   return yield* svc.execute("Espresso");
 * });
 * ```
 */
export class GetACoffeeService extends Effect.Service<GetACoffeeService>()(
	"GetACoffeeService",
	{
		effect: Effect.gen(function* () {
			const repo = yield* CoffeeRepository;
			const execute = (name: string): Effect.Effect<Coffee, CoffeeNotFoundError> =>
				Effect.flatMap(repo.findByName(name), Option.match({
					onNone: () => Effect.fail(new CoffeeNotFoundError({ coffeeName: name })),
					onSome: (coffee) => Effect.succeed(coffee),
				})).pipe(
					Effect.withSpan("GetACoffeeService.execute", { attributes: { name } }),
				);
			return {
				execute,
				executeFormatted: (args: unknown): Effect.Effect<ToolResponse> => {
					const { name } = Schema.decodeUnknownSync(GetACoffeeInput)(args);
					return execute(name).pipe(
						Effect.map((coffee) => ({
							content: [{ type: "text" as const, text: JSON.stringify(coffee) }],
						})),
						Effect.catchTag("CoffeeNotFoundError", (err) =>
							Effect.succeed({
								content: [{ type: "text" as const, text: `Coffee "${err.coffeeName}" not found` }],
							}),
						),
						Effect.withSpan("GetACoffeeService.executeFormatted", { attributes: { name } }),
					);
				},
				metaData: {
					name: "get-a-coffee" as const,
					description: "Retrieve the data for a specific coffee based on its name" as const,
				},
				inputSchema: GetACoffeeInputStandard,
			};
		}),
		dependencies: [CoffeeRepository.Default],
	},
) { }
