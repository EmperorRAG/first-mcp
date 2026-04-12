/**
 * Get-coffees service — retrieves all coffees and registers the MCP tool.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";
import { CoffeeRepository } from "../repository/coffee-repository.js";
import type { Coffee } from "../types.js";

/**
 * Service for retrieving all coffee drinks from the repository.
 *
 * @remarks
 * Depends on `CoffeeRepository` via Effect's DI. The `execute` method
 * returns an Effect that resolves to an array of all coffees.
 */
export class GetCoffeesService extends Effect.Service<GetCoffeesService>()(
	"GetCoffeesService",
	{
		effect: Effect.gen(function* () {
			const repo = yield* CoffeeRepository;
			return {
				execute: repo.findAll,
			};
		}),
		dependencies: [],
	},
) { }

/**
 * Registers the `get-coffees` MCP tool on the server.
 *
 * @param server - The MCP server to register the tool on.
 * @param runtime - The managed runtime providing `GetCoffeesService`.
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
			const coffees: Coffee[] = await runtime.runPromise(
				Effect.gen(function* () {
					const service = yield* GetCoffeesService;
					return yield* service.execute;
				}),
			);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(coffees) }],
			};
		},
	);
}
