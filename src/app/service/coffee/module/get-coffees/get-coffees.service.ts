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
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";
import { CoffeeRepository } from "../../repository/coffee-repository.js";

/**
 * Effect service for retrieving all coffee drinks from the repository.
 *
 * @remarks
 * Created via {@link Effect.Service} with an `effect` factory that
 * resolves {@link CoffeeRepository} from the DI context.  Exposes
 * two accessors:
 *
 * - **`execute`** — returns `Effect<ReadonlyArray<Coffee>>` via
 *   {@link CoffeeRepository.findAll}.
 * - **`executeFormatted`** — wraps `execute` to produce an
 *   MCP-compatible `{ content: [{ type: "text", text }] }` response
 *   by JSON-serializing the full array.
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
				executeFormatted: execute.pipe(
					Effect.map((coffees) => ({
						content: [{ type: "text" as const, text: JSON.stringify(coffees) }],
					})),
				),
			};
		}),
	},
) { }

/**
 * Registers the `get-coffees` MCP tool on the given server.
 *
 * @remarks
 * Wiring steps:
 *
 * 1. Calls {@link McpServer.registerTool} with tool name
 *    `"get-coffees"` and a description (no `inputSchema` — the
 *    tool accepts no arguments).
 * 2. In the async handler, delegates to
 *    {@link GetCoffeesService.executeFormatted | executeFormatted}
 *    inside the provided {@link ManagedRuntime}.
 *
 * @param server - The {@link McpServer} instance to register on.
 * @param runtime - A {@link ManagedRuntime} whose environment
 *   includes {@link GetCoffeesService}.
 */
export function registerGetCoffeesTool(
	server: McpServer,
	runtime: ManagedRuntime.ManagedRuntime<GetCoffeesService, unknown>,
): void {
	server.registerTool(
		"get-coffees",
		{
			description: "Get a list of all coffees",
		},
		async () => {
			return runtime.runPromise(
				Effect.gen(function* () {
					const service = yield* GetCoffeesService;
					return yield* service.executeFormatted;
				}),
			);
		},
	);
}
