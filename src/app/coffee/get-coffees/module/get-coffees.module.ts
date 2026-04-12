/**
 * Wires the get-coffees module: repository to service to controller to tool registration.
 *
 * @module
 */
import type { McpServer } from "@modelcontextprotocol/server";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { GetCoffeesService } from "../service/get-coffees.service.js";
import { GetCoffeesController } from "../controller/get-coffees.controller.js";
import { registerGetCoffeesTool } from "../tool/get-coffees.tool.js";

/**
 * Wires the get-coffees module-service chain and registers the MCP tool.
 *
 * @param server - The MCP server to register the tool on.
 * @param repo - The coffee repository for data access.
 *
 * @remarks
 * Creates the service and controller instances with dependency injection,
 * then delegates tool registration to {@link registerGetCoffeesTool}.
 * Wiring order: repository → {@link GetCoffeesService} →
 * {@link GetCoffeesController} → tool.
 */
export function registerGetCoffeesModule(
	server: McpServer,
	repo: CoffeeRepository,
): void {
	const service = new GetCoffeesService(repo);
	const controller = new GetCoffeesController(service);
	registerGetCoffeesTool(server, controller);
}
