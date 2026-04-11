import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpServer } from "./mcp-server.js";

describe("createServer", () => {
	it("returns an McpServer instance", () => {
		const server = createMcpServer();
		expect(server).toBeInstanceOf(McpServer);
	});

	it("registers coffee domain tools", () => {
		const server = createMcpServer();
		const tools = (
			server as unknown as {
				_registeredTools: Record<string, unknown>;
			}
		)._registeredTools;
		expect(Object.keys(tools)).toContain("get-coffees");
		expect(Object.keys(tools)).toContain("get-a-coffee");
	});
});
