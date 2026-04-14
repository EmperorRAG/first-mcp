/**
 * Coffee domain — composes the repository and service {@link Layer}s and
 * registers all MCP tools for the coffee catalog.
 *
 * @remarks
 * This module is the domain barrel for the coffee bounded context.  It
 * wires shared infrastructure ({@link InMemoryCoffeeRepository}) into each
 * tool-service ({@link GetCoffeesService}, {@link GetACoffeeService}) via
 * {@link Layer.mergeAll} and {@link Layer.provide}, producing a single
 * {@link CoffeeDomainLive} layer.  The {@link registerCoffeeTools}
 * function then connects the fully-provided services to the MCP server
 * through a {@link ManagedRuntime}.
 *
 * @module
 */
import { Layer } from "effect";
import type { ManagedRuntime } from "effect";
import {
	InMemoryCoffeeRepository,
} from "./repository/coffee-repository.js";
import {
	GetCoffeesService,
	registerGetCoffeesTool,
} from "./module/get-coffees/get-coffees.service.js";
import {
	GetACoffeeService,
	registerGetACoffeeTool,
} from "./module/get-a-coffee/get-a-coffee.service.js";

/**
 * Composed {@link Layer} providing all coffee domain services with their
 * repository dependency already satisfied.
 *
 * @remarks
 * Construction proceeds in two steps:
 *
 * 1. {@link Layer.mergeAll} combines `GetCoffeesService.Default` and
 *    `GetACoffeeService.Default` into a single layer that requires
 *    `CoffeeRepository`.
 * 2. {@link Layer.provide} feeds {@link InMemoryCoffeeRepository} into
 *    that combined layer, eliminating the repository requirement.
 *
 * The resulting layer has no unsatisfied dependencies and can be handed
 * directly to {@link ManagedRuntime.make} for use in the MCP server
 * startup sequence.
 *
 * @example
 * ```ts
 * import { ManagedRuntime } from "effect";
 * import { CoffeeDomainLive } from "./domain.js";
 *
 * const runtime = ManagedRuntime.make(CoffeeDomainLive);
 * ```
 */
export const CoffeeDomainLive = Layer.mergeAll(
	GetCoffeesService.Default,
	GetACoffeeService.Default,
).pipe(Layer.provide(InMemoryCoffeeRepository));

/**
 * Union of all service tags that {@link CoffeeDomainLive} satisfies.
 *
 * @remarks
 * Used as the `R` (requirements) type parameter when constructing a
 * {@link ManagedRuntime.ManagedRuntime} from {@link CoffeeDomainLive}.
 * The union currently includes {@link GetCoffeesService} and
 * {@link GetACoffeeService}; extending the domain with new tools means
 * adding their service tags here.
 */
export type CoffeeDomainServices = GetCoffeesService | GetACoffeeService;

/**
 * Registers every coffee domain tool on the given MCP server.
 *
 * @remarks
 * Delegates to the per-tool registration functions
 * ({@link registerGetCoffeesTool}, {@link registerGetACoffeeTool}),
 * passing the shared {@link ManagedRuntime} so that each tool's handler
 * can resolve its service from the runtime via `runtime.runPromise`.
 *
 * Adding a new tool to the coffee domain requires:
 *
 * 1. Creating the tool-service module under `module/`.
 * 2. Importing and calling its `register*Tool` function here.
 * 3. Adding its service tag to {@link CoffeeDomainServices}.
 *
 * @param server - The MCP server instance to register tools on.  Typed
 *        via `Parameters<typeof registerGetCoffeesTool>[0]` to avoid a
 *        direct import of the MCP server type.
 * @param runtime - A {@link ManagedRuntime.ManagedRuntime} providing
 *        {@link CoffeeDomainServices}, used by each tool handler to
 *        execute service effects.
 */
export function registerCoffeeTools(
	server: Parameters<typeof registerGetCoffeesTool>[0],
	runtime: ManagedRuntime.ManagedRuntime<CoffeeDomainServices, unknown>,
): void {
	registerGetCoffeesTool(server, runtime);
	registerGetACoffeeTool(server, runtime);
}
