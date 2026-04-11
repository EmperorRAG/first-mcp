import type { McpServer } from "@modelcontextprotocol/server";
import { GetACoffeeInputSchema } from "../dto/get-a-coffee.dto.js";
import type { GetACoffeeController } from "../controller/get-a-coffee.controller.js";

export function registerGetACoffeeTool(
	server: McpServer,
	controller: GetACoffeeController,
): void {
	server.registerTool(
		"get-a-coffee",
		{
			description:
				"Retrieve the data for a specific coffee based on its name",
			inputSchema: GetACoffeeInputSchema,
		},
		async ({ name }) => controller.handle({ name }),
	);
}
