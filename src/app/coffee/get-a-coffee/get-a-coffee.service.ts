/**
 * Get-a-coffee service — retrieves a single coffee by name and registers the MCP tool.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";
import { CoffeeRepository } from "../repository/coffee-repository.js";
import type { Coffee } from "../types.js";
import { CoffeeNotFoundError } from "../errors.js";
import { GetACoffeeInputStandard } from "./get-a-coffee.schema.js";

/**
 * Service for retrieving a single coffee drink by name.
 *
 * @remarks
 * Depends on `CoffeeRepository` via Effect's DI. The `execute` method
 * returns an Effect that resolves to the matching coffee, or fails
 * with `CoffeeNotFoundError` if no match is found.
 */
export class GetACoffeeService extends Effect.Service<GetACoffeeService>()(
	"GetACoffeeService",
	{
		effect: Effect.gen(function* () {
			const repo = yield* CoffeeRepository;
			return {
				execute: (name: string): Effect.Effect<Coffee, CoffeeNotFoundError> =>
					Effect.flatMap(repo.findByName(name), (coffee) =>
						coffee
							? Effect.succeed(coffee)
							: Effect.fail(new CoffeeNotFoundError({ coffeeName: name })),
					),
			};
		}),
		dependencies: [],
	},
) { }

/**
 * Registers the `get-a-coffee` MCP tool on the server.
 *
 * @param server - The MCP server to register the tool on.
 * @param runtime - The managed runtime providing `GetACoffeeService`.
 */
export function registerGetACoffeeTool(
	server: McpServer,
	runtime: ManagedRuntime.ManagedRuntime<GetACoffeeService, unknown>,
): void {
	server.registerTool(
		"get-a-coffee",
		{
			description:
				"Retrieve the data for a specific coffee based on its name",
			inputSchema: GetACoffeeInputStandard,
		},
		async (args) => {
			const { name } = args as { name: string };
			return runtime.runPromise(
				Effect.gen(function* () {
					const service = yield* GetACoffeeService;
					const coffee = yield* service.execute(name);
					return {
						content: [
							{ type: "text" as const, text: JSON.stringify(coffee) },
						],
					};
				}).pipe(
					Effect.catchTag("CoffeeNotFoundError", (err) =>
						Effect.succeed({
							content: [
								{
									type: "text" as const,
									text: `Coffee "${err.coffeeName}" not found`,
								},
							],
						}),
					),
				),
			);
		},
	);
}
