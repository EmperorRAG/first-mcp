/**
 * Unit BDD step definitions for the MCP server factory.
 * Covers type checks and tool registration assertions for `createMcpServer`.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { getRegisteredToolNames } from "../../../testing/utility/mcp-server-introspection.utility.js";

Then("the server should be an McpServer", (world: QuickPickleWorldInterface) => {
	expect(world.serverInstance).toBeInstanceOf(McpServer);
});

Then("the server should have a {string} tool", (world: QuickPickleWorldInterface, toolName: string) => {
	const toolNames = getRegisteredToolNames(world.serverInstance);
	expect(toolNames).toContain(toolName);
});
