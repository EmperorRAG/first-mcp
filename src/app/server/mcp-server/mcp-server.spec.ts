import { describe, it, expect, vi } from "vitest";
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
		const spy = vi.spyOn(McpServer.prototype, "registerTool");

		createMcpServer(testConfig);

		const toolNames = spy.mock.calls.map((call) => call[0]);
		expect(toolNames).toContain("get-coffees");
		expect(toolNames).toContain("get-a-coffee");

		spy.mockRestore();
	});
});
