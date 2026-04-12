/**
 * Unit tests for the `createMcpServer` factory, verifying it returns an McpServer
 * instance and registers all coffee domain tools.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "./mcp-server.js";
import { defaultTestServerConfig } from "../../testing/factory/server-config.factory.js";
import { getRegisteredToolNames } from "../../testing/utility/mcp-server-introspection.utility.js";

describe("createServer", () => {
	it("returns an McpServer instance", () => {
		const server = createMcpServer(defaultTestServerConfig);
		expect(server).toBeInstanceOf(McpServer);
	});

	it("registers coffee domain tools", () => {
		const server = createMcpServer(defaultTestServerConfig);
		const toolNames = getRegisteredToolNames(server);
		expect(toolNames).toContain("get-coffees");
		expect(toolNames).toContain("get-a-coffee");
	});
});
