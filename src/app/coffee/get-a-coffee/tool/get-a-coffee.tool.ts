import type { McpServer } from "@modelcontextprotocol/server";
import { GetACoffeeInputSchema } from "../dto/get-a-coffee.dto.js";
import type { GetACoffeeControllerClass } from "../controller/get-a-coffee.controller.js";

export function registerGetACoffeeTool(
	server: McpServer,
	controller: GetACoffeeControllerClass,
): void {
	server.registerTool(
		"get-a-coffee",
		{
			description:
				"Retrieve the data for a specific coffee based on its name",
			inputSchema: GetACoffeeInputSchema,
		},
		({ name }) => controller.handle({ name }),
	);
}
