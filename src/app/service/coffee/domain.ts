/**
 * Coffee domain — Effect service that exposes each coffee tool as a
 * named {@link RegisterableTool} property plus a
 * {@link CoffeeDomain.registerCoffeeTools | registerCoffeeTools}
 * method for batch tool registration.
 *
 * @remarks
 * This module is the domain barrel for the coffee bounded context.
 * {@link CoffeeDomain} is an {@link Effect.Service} whose `effect`
 * factory yields the child services
 * ({@link GetCoffeesService}, {@link GetACoffeeService}) and returns
 * an object whose values satisfy the {@link RegisterableTool} interface.
 *
 * The {@link CoffeeDomain.registerCoffeeTools | registerCoffeeTools}
 * return property iterates over the domain's tool properties and
 * registers only those whose `metaData.name` appears in the given
 * {@link ActiveToolsRecord}.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";
import { GetCoffeesService } from "./module/get-coffees/get-coffees.service.js";
import { GetACoffeeService } from "./module/get-a-coffee/get-a-coffee.service.js";
import type {
	RegisterableTool,
	ActiveToolsRecord,
} from "../../server/mcp/registerable-tool.js";

/**
 * Effect service exposing coffee domain tools as named properties
 * and a batch registration method.
 *
 * @remarks
 * Each property (`getCoffees`, `getACoffee`) satisfies the
 * {@link RegisterableTool} interface, carrying `metaData`,
 * optional `inputSchema`, and `executeFormatted`.  The
 * {@link registerCoffeeTools} method iterates over these properties
 * and registers only those whose `metaData.name` appears in the
 * given {@link ActiveToolsRecord}.
 *
 * The `dependencies` array bundles both child services so the domain
 * can be provided with a single `CoffeeDomain.Default`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { CoffeeDomain } from "./domain.js";
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
			const getCoffeesService = yield* GetCoffeesService;
			const getACoffeeService = yield* GetACoffeeService;

			const getCoffees = {
				metaData: getCoffeesService.metaData,
				executeFormatted: getCoffeesService.executeFormatted,
			} satisfies RegisterableTool;

			const getACoffee = {
				metaData: getACoffeeService.metaData,
				inputSchema: getACoffeeService.inputSchema,
				executeFormatted: getACoffeeService.executeFormatted,
			} satisfies RegisterableTool;

			return {
				getCoffees,
				getACoffee,

				/**
				 * Registers active coffee tools on the given MCP server.
				 *
				 * @remarks
				 * Iterates over every tool in this domain and registers a
				 * tool only when its `metaData.name` key exists in the
				 * {@link ActiveToolsRecord}.  Each tool's async handler
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
					activeTools: ActiveToolsRecord,
					runtime: ManagedRuntime.ManagedRuntime<CoffeeDomain, unknown>,
				): void {
					const tools: RegisterableTool[] = [getCoffees, getACoffee];
					for (const tool of tools) {
						if (!activeTools[tool.metaData.name]) continue;
						server.registerTool(
							tool.metaData.name,
							{
								description: tool.metaData.description,
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								...(tool.inputSchema != null ? { inputSchema: tool.inputSchema } : {}),
							},
							async (args: Record<string, unknown>) =>
								runtime.runPromise(tool.executeFormatted(args)),
						);
					}
				},
			};
		}),
		dependencies: [GetCoffeesService.Default, GetACoffeeService.Default],
	},
) { }
