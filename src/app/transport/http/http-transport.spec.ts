/**
 * Unit tests for the raw Node.js HTTP transport.
 *
 * @module
 */
import { describe, it, expect, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { startHttpServer, type HttpServerHandle } from "./http-transport.js";

function createTestServer(): McpServer {
	const server = new McpServer({ name: "test", version: "1.0.0" });
	server.registerTool("echo", { description: "Echo test" }, async () => ({
		content: [{ type: "text" as const, text: "hello" }],
	}));
	return server;
}

describe("http-transport (raw Node.js)", () => {
	let handle: HttpServerHandle | undefined;

	afterEach(async () => {
		if (handle) {
			await handle.close();
			handle = undefined;
		}
	});

	it("exports startHttpServer as a function", () => {
		expect(typeof startHttpServer).toBe("function");
	});

	it("GET /health returns { status: 'ok' }", async () => {
		handle = startHttpServer(() => createTestServer(), 0);
		await new Promise((r) => setTimeout(r, 50));
		const addr = handle.address()!;
		const res = await fetch(`http://127.0.0.1:${addr.port}/health`);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ status: "ok" });
	});

	it("POST /mcp without session returns 400 for non-initialize", async () => {
		handle = startHttpServer(() => createTestServer(), 0);
		await new Promise((r) => setTimeout(r, 50));
		const addr = handle.address()!;
		const res = await fetch(`http://127.0.0.1:${addr.port}/mcp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
		});
		expect(res.status).toBe(400);
	});

});
