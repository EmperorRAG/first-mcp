import type { McpServer } from "@modelcontextprotocol/server";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { GetACoffeeService } from "../service/get-a-coffee.service.js";
import { GetACoffeeController } from "../controller/get-a-coffee.controller.js";
import { registerGetACoffeeTool } from "../tool/get-a-coffee.tool.js";

/**
 * Wires the get-a-coffee module-service chain and registers the MCP tool.
 *
 * @param server - The MCP server to register the tool on.
 * @param repo - The coffee repository for data access.
 *
 * @remarks
 * Creates the service and controller instances with dependency injection,
 * then delegates tool registration to {@link registerGetACoffeeTool}.
 * Wiring order: repository → {@link GetACoffeeService} →
 * {@link GetACoffeeController} → tool.
 */
export function registerGetACoffeeModule(
	server: McpServer,
	repo: CoffeeRepository,
): void {
	const service = new GetACoffeeService(repo);
	const controller = new GetACoffeeController(service);
	registerGetACoffeeTool(server, controller);
}
