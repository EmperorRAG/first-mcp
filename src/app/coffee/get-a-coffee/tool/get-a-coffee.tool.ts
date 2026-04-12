import type { McpServer } from "@modelcontextprotocol/server";
import { GetACoffeeInputSchema } from "../dto/get-a-coffee.dto.js";
import type { GetACoffeeControllerClass } from "../controller/get-a-coffee.controller.js";

/**
 * Registers the `get-a-coffee` MCP tool on the server.
 *
 * @param server - The MCP server to register the tool on.
 * @param controller - The controller that handles tool invocations.
 *
 * @remarks
 * Registers a tool named `"get-a-coffee"` that retrieves data for a specific
 * coffee by name. Uses {@link GetACoffeeInputSchema} for input validation.
 *
 * @see {@link GetACoffeeControllerClass} for the handler contract.
 */
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
