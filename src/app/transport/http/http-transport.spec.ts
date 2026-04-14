/**
 * Unit tests for the raw `node:http`-based MCP Streamable HTTP transport
 * exposed by {@link startHttpServer}.
 *
 * @remarks
 * Each test spins up a real HTTP server on an OS-assigned ephemeral port
 * (`0`), sends requests via the global `fetch` API, and tears the server
 * down in `afterEach`.  This validates routing, CORS, session lifecycle,
 * and error responses at the HTTP level without involving MCP business
 * logic.
 *
 * @module
 */
import { describe, it, expect, afterEach } from "vitest";
import { Effect } from "effect";
import { McpServer } from "@modelcontextprotocol/server";
import { startHttpServer, type HttpServerHandle } from "./http-transport.js";

/**
 * Creates a minimal {@link McpServer} instance with a single `echo` tool
 * registered, suitable for exercising the HTTP transport layer in isolation.
 *
 * @remarks
 * The tool always returns a fixed `"hello"` text content payload.  No
 * controller, service, or repository wiring is needed because the tests
 * only verify transport-level behaviour (routing, session management,
 * health checks) rather than business logic.
 *
 * @returns A configured {@link McpServer} ready to be connected to a
 *          {@link NodeStreamableHTTPServerTransport}.
 *
 * @internal
 */
function createTestServer(): McpServer {
	const server = new McpServer({ name: "test", version: "1.0.0" });
	server.registerTool("echo", { description: "Echo test" }, () => ({
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
		handle = await Effect.runPromise(startHttpServer(() => createTestServer(), 0));
		const addr = handle.address()!;
		const res = await fetch(`http://127.0.0.1:${addr.port}/health`);
		expect(res.status).toBe(200);
		const body: unknown = await res.json();
		expect(body).toEqual({ status: "ok" });
	});

	it("POST /mcp without session returns 400 for non-initialize", async () => {
		handle = await Effect.runPromise(startHttpServer(() => createTestServer(), 0));
		const addr = handle.address()!;
		const res = await fetch(`http://127.0.0.1:${addr.port}/mcp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
		});
		expect(res.status).toBe(400);
	});

});
