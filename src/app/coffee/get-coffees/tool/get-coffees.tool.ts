import type { McpServer } from "@modelcontextprotocol/server";
import type { GetCoffeesController } from "../controller/get-coffees.controller.js";

export function registerGetCoffeesTool(
	server: McpServer,
	controller: GetCoffeesController,
): void {
	server.registerTool(
		"get-coffees",
		{
			description: "Get a list of all coffees",
		},
		() => controller.handle(),
	);
}
