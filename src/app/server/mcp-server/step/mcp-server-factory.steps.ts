import { When, Then } from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "../mcp-server.js";
import {
	SERVER_NAME,
	SERVER_VERSION,
} from "../../../config/mcp-server/mcp-server.config.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		serverInstance: McpServer;
	}
}

When("I create a server instance", (world) => {
	world.serverInstance = createMcpServer();
});

Then("the server should be an McpServer", (world) => {
	expect(world.serverInstance).toBeInstanceOf(McpServer);
});

Then("the server should have a {string} tool", (world, toolName: string) => {
	const tools = (
		world.serverInstance as unknown as {
			_registeredTools: Record<string, unknown>;
		}
	)._registeredTools;
	expect(Object.keys(tools)).toContain(toolName);
});

// Contract steps

Then("the server name should be {string}", (world, name: string) => {
	expect(name).toBe(SERVER_NAME);
	const serverInfo = (
		world.serverInstance as unknown as {
			server: { _serverInfo: { name: string } };
		}
	).server._serverInfo;
	expect(serverInfo.name).toBe(name);
});

Then("the server version should be {string}", (world, version: string) => {
	expect(version).toBe(SERVER_VERSION);
	const serverInfo = (
		world.serverInstance as unknown as {
			server: { _serverInfo: { version: string } };
		}
	).server._serverInfo;
	expect(serverInfo.version).toBe(version);
});
