import { When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "../mcp-server.js";
import {
	SERVER_NAME,
	SERVER_VERSION,
} from "../../../config/mcp-server/mcp-server.config.js";
import type { ServerConfig } from "../../../config/mcp-server/mcp-server.config.js";

const testConfig: ServerConfig = {
	name: SERVER_NAME,
	version: SERVER_VERSION,
	port: 0,
};

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		serverInstance: McpServer;
	}
}

function getRegisteredToolNames(server: McpServer): string[] {
	const tools: unknown = Reflect.get(server, "_registeredTools");
	if (typeof tools !== "object" || tools === null) {
		throw new Error("Server does not expose _registeredTools");
	}
	return Object.keys(tools);
}

function getServerInfoValue(server: McpServer, key: "name" | "version"): string {
	const internalServer: unknown = Reflect.get(server, "server");
	if (typeof internalServer !== "object" || internalServer === null) {
		throw new Error("Server internal object is unavailable");
	}

	const serverInfo: unknown = Reflect.get(internalServer, "_serverInfo");
	if (typeof serverInfo !== "object" || serverInfo === null) {
		throw new Error("Server info is unavailable");
	}

	const value: unknown = Reflect.get(serverInfo, key);
	if (typeof value !== "string") {
		throw new Error(`Server info field ${key} is not a string`);
	}

	return value;
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
