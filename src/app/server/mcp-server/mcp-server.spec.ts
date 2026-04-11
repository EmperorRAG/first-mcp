import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "./mcp-server.js";
import type { ServerConfig } from "../../config/mcp-server/mcp-server.config.js";

const testConfig: ServerConfig = {
	name: "test-server",
	version: "0.0.1",
	port: 0,
};

describe("createServer", () => {
	it("returns an McpServer instance", () => {
		const server = createMcpServer(testConfig);
		expect(server).toBeInstanceOf(McpServer);
	});

	it("registers coffee domain tools", () => {
		const server = createMcpServer(testConfig);
		const tools = (
			server as unknown as {
				_registeredTools: Record<string, unknown>;
			}
		)._registeredTools;
		expect(Object.keys(tools)).toContain("get-coffees");
		expect(Object.keys(tools)).toContain("get-a-coffee");
	});
});
