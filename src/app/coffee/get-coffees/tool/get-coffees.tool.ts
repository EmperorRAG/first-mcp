import type { McpServer } from "@modelcontextprotocol/server";
import type { GetCoffeesControllerClass } from "../controller/get-coffees.controller.js";

/**
 * Registers the `get-coffees` MCP tool on the server.
 *
 * @param server - The MCP server to register the tool on.
 * @param controller - The controller that handles tool invocations.
 *
 * @remarks
 * Registers a tool named `"get-coffees"` that returns a list of all
 * available coffees. This tool has no input parameters.
 *
 * @see {@link GetCoffeesControllerClass} for the handler contract.
 */
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
