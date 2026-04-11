import type { McpServer } from "@modelcontextprotocol/server";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import { GetCoffeesService } from "../service/get-coffees.service.js";
import { GetCoffeesController } from "../controller/get-coffees.controller.js";
import { registerGetCoffeesTool } from "../tool/get-coffees.tool.js";

export function registerGetCoffeesModule(
	server: McpServer,
	repo: CoffeeRepository,
): void {
	const service = new GetCoffeesService(repo);
	const controller = new GetCoffeesController(service);
	registerGetCoffeesTool(server, controller);
}
