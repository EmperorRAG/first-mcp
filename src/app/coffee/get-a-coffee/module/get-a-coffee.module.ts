import type { McpServer } from "@modelcontextprotocol/server";
import type { CoffeeRepository } from "../../shared/repository/coffee.repository.js";
import { GetACoffeeService } from "../service/get-a-coffee.service.js";
import { GetACoffeeController } from "../controller/get-a-coffee.controller.js";
import { registerGetACoffeeTool } from "../tool/get-a-coffee.tool.js";

export function registerGetACoffeeModule(
	server: McpServer,
	repo: CoffeeRepository,
): void {
	const service = new GetACoffeeService(repo);
	const controller = new GetACoffeeController(service);
	registerGetACoffeeTool(server, controller);
}
