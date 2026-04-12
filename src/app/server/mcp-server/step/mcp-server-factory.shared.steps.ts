/**
 * Shared BDD step definitions for the MCP server factory.
 * Provides the server creation step used by both unit and contract features.
 *
 * @module
 */
import { When, type QuickPickleWorldInterface } from "quickpickle";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "../mcp-server.js";
import {
	SERVER_NAME,
	SERVER_VERSION,
} from "../../../config/mcp-server/mcp-server.config.js";
import { createTestServerConfig } from "../../../testing/factory/server-config.factory.js";

const testConfig = createTestServerConfig({
	name: SERVER_NAME,
	version: SERVER_VERSION,
});

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		serverInstance: McpServer;
	}
}

When("I create a server instance", (world: QuickPickleWorldInterface) => {
	world.serverInstance = createMcpServer(testConfig);
});
