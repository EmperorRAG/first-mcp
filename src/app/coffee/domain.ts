/**
 * Coffee domain — composes repository and service layers, registers all tools.
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
} from "./get-coffees/get-coffees.service.js";
import {
	GetACoffeeService,
	registerGetACoffeeTool,
} from "./get-a-coffee/get-a-coffee.service.js";

/**
 * Composed layer providing all coffee domain services.
 *
 * @remarks
 * Merges the in-memory repository with both tool services.
 * Provide this layer to a `ManagedRuntime` to enable coffee domain operations.
 */
export const CoffeeDomainLive = Layer.mergeAll(
	GetCoffeesService.Default,
	GetACoffeeService.Default,
).pipe(Layer.provide(InMemoryCoffeeRepository));

/**
 * Service requirements fulfilled by `CoffeeDomainLive`.
 */
export type CoffeeDomainServices = GetCoffeesService | GetACoffeeService;

/**
 * Registers all coffee domain tools on the MCP server.
 *
 * @param server - The MCP server to register tools on.
 * @param runtime - The managed runtime providing coffee domain services.
 */
export function registerCoffeeTools(
	server: Parameters<typeof registerGetCoffeesTool>[0],
	runtime: ManagedRuntime.ManagedRuntime<CoffeeDomainServices, unknown>,
): void {
	registerGetCoffeesTool(server, runtime);
	registerGetACoffeeTool(server, runtime);
}
