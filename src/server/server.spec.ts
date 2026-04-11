import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { createServer } from "./server.js";

describe("createServer", () => {
	it("returns an McpServer instance", () => {
		const server = createServer();
		expect(server).toBeInstanceOf(McpServer);
	});

	it("registers coffee domain tools", () => {
		const server = createServer();
		const tools = (
			server as unknown as {
				_registeredTools: Record<string, unknown>;
			}
		)._registeredTools;
		expect(Object.keys(tools)).toContain("get-coffees");
		expect(Object.keys(tools)).toContain("get-a-coffee");
	});
});
