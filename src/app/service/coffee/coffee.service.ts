/**
 * Coffee domain — Effect service that exposes each coffee tool as a
 * named registerable tool property plus a
 * {@link CoffeeDomain.registerCoffeeTools | registerCoffeeTools}
 * method for batch tool registration.
 *
 * @remarks
 * This module is the domain barrel for the coffee bounded context.
 * {@link CoffeeDomain} is an {@link Effect.Service} whose `effect`
 * factory yields {@link CoffeeRepository} and binds the get-coffees
 * and get-a-coffee functions to that repository so the resulting
 * `executeFormatted` closures carry no requirements channel.
 *
 * Tool metadata (`metaData`, `inputSchema`) is declared at module
 * scope alongside the closure construction.
 *
 * The {@link CoffeeDomain.registerCoffeeTools | registerCoffeeTools}
 * return property iterates over the domain's tool properties and
 * registers only those whose `metaData.name` appears in the given
 * active-tools record.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpServer, StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";
import { CoffeeRepository } from "./shared/repository/coffee/repository.js";
import { getCoffees } from "./get-coffees/get-coffees.js";
import { getACoffee } from "./get-a-coffee/get-a-coffee.js";
import { GetACoffeeInputStandard } from "./get-a-coffee/get-a-coffee.schema.js";

/**
 * Static metadata for the `get-coffees` tool.
 *
 * @internal
 */
const getCoffeesMetaData = {
	name: "get-coffees" as const,
	description: "Get a list of all coffees" as const,
};

/**
 * Static metadata for the `get-a-coffee` tool.
 *
 * @internal
 */
const getACoffeeMetaData = {
	name: "get-a-coffee" as const,
	description:
		"Retrieve the data for a specific coffee based on its name" as const,
};

/**
 * Effect service exposing coffee domain tools as named properties
 * and a batch registration method.
 *
 * @remarks
 * Each property (`getCoffees`, `getACoffee`) carries `metaData`,
 * optional `inputSchema`, and `executeFormatted`.  The
 * {@link registerCoffeeTools} method iterates over these properties
 * and registers only those whose `metaData.name` appears in the
 * given active-tools record.
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
 *   console.log(domain.getCoffees.metaData.name);
 * });
 * ```
 */
export class CoffeeDomain extends Effect.Service<CoffeeDomain>()(
	"CoffeeDomain",
	{
		effect: Effect.gen(function* () {
			const repo = yield* CoffeeRepository;

			const getCoffeesTool = {
				metaData: getCoffeesMetaData,
				executeFormatted: (args: unknown) =>
					getCoffees(args).pipe(
						Effect.provideService(CoffeeRepository, repo),
					),
			};

			const getACoffeeTool = {
				metaData: getACoffeeMetaData,
				inputSchema: GetACoffeeInputStandard,
				executeFormatted: (args: unknown) =>
					getACoffee(args).pipe(
						Effect.provideService(CoffeeRepository, repo),
					),
			};

			return {
				getCoffees: getCoffeesTool,
				getACoffee: getACoffeeTool,

				/**
				 * Registers active coffee tools on the given MCP server.
				 *
				 * @remarks
				 * Iterates over every tool in this domain and registers a
				 * tool only when its `metaData.name` key exists in the
				 * active-tools record.  Each tool's async handler
				 * delegates to `executeFormatted` via the provided
				 * {@link ManagedRuntime}.
				 *
				 * @param server - The MCP server to register tools on.
				 * @param activeTools - Record of tool names mapped to
				 *   active status.
				 * @param runtime - A {@link ManagedRuntime} providing
				 *   {@link CoffeeDomain} for executing tool effects.
				 */
				registerCoffeeTools(
					server: McpServer,
					activeTools: Record<string, boolean>,
					runtime: ManagedRuntime.ManagedRuntime<CoffeeDomain, unknown>,
				): void {
					const tools: {
						readonly metaData: { readonly name: string; readonly description: string };
						readonly inputSchema?: unknown;
						readonly executeFormatted: (args: unknown) => Effect.Effect<{ [key: string]: unknown; content: { type: "text"; text: string }[] }>;
					}[] = [getCoffeesTool, getACoffeeTool];
					for (const tool of tools) {
						if (!activeTools[tool.metaData.name]) continue;
						server.registerTool(
							tool.metaData.name,
							{
								description: tool.metaData.description,
								// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
								...(tool.inputSchema != null ? { inputSchema: tool.inputSchema as StandardSchemaWithJSON<unknown, unknown> } : {}),
							},
							async (args: unknown) =>
								runtime.runPromise(tool.executeFormatted(args)),
						);
					}
				},
			};
		}),
		dependencies: [CoffeeRepository.Default],
	},
) { }
