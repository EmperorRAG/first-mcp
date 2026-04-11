import { When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "../mcp-server.js";
import {
	SERVER_NAME,
	SERVER_VERSION,
} from "../../../config/mcp-server/mcp-server.config.js";
import { createTestServerConfig } from "../../../testing/factory/server-config.factory.js";
import {
	getRegisteredToolNames,
	getServerInfoValue,
} from "../../../testing/utility/mcp-server-introspection.utility.js";

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

Then("the server should be an McpServer", (world: QuickPickleWorldInterface) => {
	expect(world.serverInstance).toBeInstanceOf(McpServer);
});

Then("the server should have a {string} tool", (world: QuickPickleWorldInterface, toolName: string) => {
	const toolNames = getRegisteredToolNames(world.serverInstance);
	expect(toolNames).toContain(toolName);
});

// Contract steps

Then("the server name should be {string}", (world: QuickPickleWorldInterface, name: string) => {
	expect(name).toBe(SERVER_NAME);
	const serverName = getServerInfoValue(world.serverInstance, "name");
	expect(serverName).toBe(name);
});

Then("the server version should be {string}", (world: QuickPickleWorldInterface, version: string) => {
	expect(version).toBe(SERVER_VERSION);
	const serverVersion = getServerInfoValue(world.serverInstance, "version");
	expect(serverVersion).toBe(version);
});
