import type { McpServer } from "@modelcontextprotocol/server";
import type { GetCoffeesControllerClass } from "../controller/get-coffees.controller.js";

export function registerGetCoffeesTool(
	server: McpServer,
	controller: GetCoffeesControllerClass,
): void {
	server.registerTool(
		"get-coffees",
		{
			description: "Get a list of all coffees",
		},
		() => controller.handle(),
	);
}
