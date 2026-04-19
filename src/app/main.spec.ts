/**
 * End-to-end tests for the MCP server — exercises the full stack
 * (layers, transport, routing, session management, domain tools)
 * via the `@modelcontextprotocol/client` SDK.
 *
 * @remarks
 * Two transport variants are tested:
 *
 * - **HTTP** — in-process layer composition with a random port,
 *   connected via {@link StreamableHTTPClientTransport}.
 * - **stdio** — child-process spawn of the compiled entry point
 *   (`build/app/main.js --stdio`) connected via
 *   {@link StdioClientTransport}.
 *
 * @module
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ConfigProvider, Effect, Layer, ManagedRuntime } from "effect";
import {
	Client,
	StreamableHTTPClientTransport,
	StdioClientTransport,
} from "@modelcontextprotocol/client";
import { AppConfig } from "./config/app/app-config.js";
import { HttpTransportLive } from "./transport/http/http-transport.js";
import { HttpRouterLive } from "./router/http/http-router.js";
import { McpServerService } from "./server/mcp/mcp-server.js";
import { HttpListener, HttpListenerLive } from "./server/http/http-listener.js";

// ---------------------------------------------------------------------------
// HTTP transport
// ---------------------------------------------------------------------------

describe("HTTP transport", () => {
	let runtime: ManagedRuntime.ManagedRuntime<
		HttpListener | McpServerService | AppConfig,
		never
	>;
	let port: number;
	let client: Client;
	let transport: StreamableHTTPClientTransport;

	beforeAll(async () => {
		const configLayer = AppConfig.Default.pipe(
			Layer.provide(
				Layer.setConfigProvider(
					ConfigProvider.fromMap(
						new Map([
							["PORT", "0"],
							["TRANSPORT_MODE", "http"],
							["ACTIVE_TOOLS", "get-coffees,get-a-coffee"],
						]),
					),
				),
			),
			Layer.orDie,
		);

		const routerLayer = HttpRouterLive.pipe(Layer.provide(configLayer));

		const depsLayer = Layer.mergeAll(
			configLayer,
			HttpTransportLive,
			routerLayer,
		);

		const mcpServerProvided = McpServerService.Default.pipe(
			Layer.provide(depsLayer),
		);

		const httpListenerProvided = HttpListenerLive.pipe(
			Layer.provide(
				Layer.mergeAll(
					configLayer,
					HttpTransportLive,
					routerLayer,
					mcpServerProvided,
				),
			),
		);

		const appLayer = Layer.mergeAll(
			configLayer,
			mcpServerProvided,
			httpListenerProvided,
		);

		runtime = ManagedRuntime.make(appLayer);

		// Start the HTTP server on port 0 (OS-assigned)
		port = await runtime.runPromise(
			Effect.gen(function* () {
				const listener = yield* HttpListener;
				yield* listener.start();
				return yield* listener.port();
			}),
		);
		// Connect MCP client
		transport = new StreamableHTTPClientTransport(
			new URL(`http://127.0.0.1:${String(port)}/mcp`),
		);
		client = new Client({ name: "e2e-test", version: "1.0.0" });
		await client.connect(transport);
	});

	afterAll(async () => {
		try { await transport.terminateSession(); } catch { /* best-effort */ }
		try { await client.close(); } catch { /* best-effort */ }
		await runtime.dispose();
	});

	// -- Health endpoint --

	it("GET /health returns { status: 'ok' }", async () => {
		const res = await fetch(`http://127.0.0.1:${String(port)}/health`);
		expect(res.status).toBe(200);
		const body: unknown = await res.json();
		expect(body).toEqual({ status: "ok" });
	});

	// -- Tool discovery --

	it("listTools returns get-coffees and get-a-coffee", async () => {
		const { tools } = await client.listTools();
		const names = tools.map((t) => t.name).sort();
		expect(names).toEqual(["get-a-coffee", "get-coffees"]);
	});

	// -- Happy paths --

	it("callTool('get-coffees') returns an array of coffees", async () => {
		const result = await client.callTool({ name: "get-coffees" });
		expect(result.isError).toBeFalsy();
		expect(result.content).toBeInstanceOf(Array);
		expect(result.content.length).toBeGreaterThan(0);

		const first = result.content[0];
		expect(first.type).toBe("text");
		if (first.type !== "text") return;

		const coffees: unknown = JSON.parse(first.text);
		expect(Array.isArray(coffees)).toBe(true);
	});

	it("callTool('get-a-coffee', { name: 'Flat White' }) returns a single coffee", async () => {
		const result = await client.callTool({
			name: "get-a-coffee",
			arguments: { name: "Flat White" },
		});
		expect(result.isError).toBeFalsy();
		expect(result.content).toHaveLength(1);

		const first = result.content[0];
		expect(first.type).toBe("text");
		if (first.type !== "text") return;

		const coffee: unknown = JSON.parse(first.text);
		expect(coffee).toHaveProperty("name", "Flat White");
	});

	// -- Error paths --

	it("callTool('get-a-coffee', { name: 'NonExistent' }) returns not-found message", async () => {
		const result = await client.callTool({
			name: "get-a-coffee",
			arguments: { name: "NonExistent" },
		});
		const first = result.content[0];
		expect(first.type).toBe("text");
		if (first.type !== "text") return;
		expect(first.text).toContain('"NonExistent" not found');
	});

	it("callTool with unknown tool name throws", async () => {
		await expect(
			client.callTool({ name: "nonexistent-tool" }),
		).rejects.toThrow();
	});
});

// ---------------------------------------------------------------------------
// stdio transport
// ---------------------------------------------------------------------------

describe("stdio transport", () => {
	let client: Client;
	let transport: StdioClientTransport;

	beforeAll(async () => {
		transport = new StdioClientTransport({
			command: "node",
			args: ["build/app/main.js", "--stdio"],
			env: {
				...process.env,
				ACTIVE_TOOLS: "get-coffees,get-a-coffee",
			},
			stderr: "pipe",
		});

		client = new Client({ name: "e2e-test-stdio", version: "1.0.0" });
		await client.connect(transport);
	});

	afterAll(async () => {
		try { await client.close(); } catch { /* best-effort */ }
	});

	it("listTools returns get-coffees and get-a-coffee", async () => {
		const { tools } = await client.listTools();
		const names = tools.map((t) => t.name).sort();
		expect(names).toEqual(["get-a-coffee", "get-coffees"]);
	});

	it("callTool('get-coffees') returns an array of coffees", async () => {
		const result = await client.callTool({ name: "get-coffees" });
		expect(result.isError).toBeFalsy();
		expect(result.content).toBeInstanceOf(Array);
		expect(result.content.length).toBeGreaterThan(0);

		const first = result.content[0];
		expect(first.type).toBe("text");
		if (first.type !== "text") return;

		const coffees: unknown = JSON.parse(first.text);
		expect(Array.isArray(coffees)).toBe(true);
	});

	it("callTool('get-a-coffee', { name: 'Flat White' }) returns a single coffee", async () => {
		const result = await client.callTool({
			name: "get-a-coffee",
			arguments: { name: "Flat White" },
		});
		expect(result.isError).toBeFalsy();
		expect(result.content).toHaveLength(1);

		const first = result.content[0];
		expect(first.type).toBe("text");
		if (first.type !== "text") return;

		const coffee: unknown = JSON.parse(first.text);
		expect(coffee).toHaveProperty("name", "Flat White");
	});

	it("callTool('get-a-coffee', { name: 'NonExistent' }) returns not-found message", async () => {
		const result = await client.callTool({
			name: "get-a-coffee",
			arguments: { name: "NonExistent" },
		});
		const first = result.content[0];
		expect(first.type).toBe("text");
		if (first.type !== "text") return;
		expect(first.text).toContain('"NonExistent" not found');
	});

	it("callTool with unknown tool name throws", async () => {
		await expect(
			client.callTool({ name: "nonexistent-tool" }),
		).rejects.toThrow();
	});
});
