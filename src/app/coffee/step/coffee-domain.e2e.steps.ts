/**
 * E2E BDD step definitions for the coffee domain.
 * Covers in-process MCP client and raw HTTP transport scenarios for full end-to-end verification.
 *
 * @module
 */
import { Given, When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { StreamableHTTPClientTransport, Client } from "@modelcontextprotocol/client";
import { createMcpServer } from "../../server/mcp-server/mcp-server.js";
import { createTestHttpServer } from "../../testing/factory/http-server.factory.js";
import {
	getTextContent,
	parseHealthStatus,
	parseSseResponse,
	parseToolCallText,
	parseToolsListPayload,
} from "../../testing/utility/mcp-response.utility.js";
import {
	parseCoffeeArrayJson,
	parseCoffeeJson,
} from "../../testing/utility/coffee-parser.utility.js";
import { testConfig, MCP_HEADERS } from "./coffee-domain.shared.steps.js";

// --- E2E In-Process steps ---

Given("an MCP server with in-process client", async (world: QuickPickleWorldInterface) => {
	const result = await createTestHttpServer(() => createMcpServer(testConfig));
	world.httpServer = result.httpServer;
	world.baseUrl = result.baseUrl;
	world.transports = result.transports;

	const transport = new StreamableHTTPClientTransport(
		new URL(`${world.baseUrl}/mcp`),
	);
	world.mcpClient = new Client({ name: "test-client", version: "1.0.0" });
	await world.mcpClient.connect(transport);
});

When("I initialize the MCP session", (_world: QuickPickleWorldInterface) => {
	// Connection was established in the Given step (connect performs initialize)
});

When("I list tools via the MCP client", async (world: QuickPickleWorldInterface) => {
	const result = await world.mcpClient.listTools();
	world.toolNames = result.tools.map((t) => t.name);
});

Then(
	"the tool list should contain {string} and {string}",
	(world: QuickPickleWorldInterface, tool1: string, tool2: string) => {
		expect(world.toolNames).toContain(tool1);
		expect(world.toolNames).toContain(tool2);
	},
);

When("I call {string} via the MCP client", async (world: QuickPickleWorldInterface, toolName: string) => {
	const result = await world.mcpClient.callTool({ name: toolName });
	world.mcpResponse = result;
	if (Array.isArray(result.content)) {
		const textContent = getTextContent(result.content);
		if (textContent) {
			try {
				world.allCoffees = parseCoffeeArrayJson(textContent);
			} catch {
				world.allCoffees = [];
			}
		}
	}
});

Then(
	"the MCP response should contain {int} coffees",
	(world: QuickPickleWorldInterface, count: number) => {
		expect(world.allCoffees).toHaveLength(count);
	},
);

When(
	"I call {string} with name {string} via the MCP client",
	async (world: QuickPickleWorldInterface, toolName: string, name: string) => {
		const result = await world.mcpClient.callTool({
			name: toolName,
			arguments: { name },
		});
		world.mcpResponse = result;
		if (Array.isArray(result.content)) {
			const textContent = getTextContent(result.content);
			if (textContent) {
				try {
					world.singleCoffee = parseCoffeeJson(textContent);
				} catch {
					world.singleCoffee = undefined;
				}
			}
		}
	},
);

Then(
	"the MCP response should contain a coffee named {string}",
	(world: QuickPickleWorldInterface, name: string) => {
		expect(world.singleCoffee).toBeDefined();
		expect(world.singleCoffee!.name).toBe(name);
	},
);

// --- E2E HTTP steps ---

Given("an MCP HTTP server is running", async (world: QuickPickleWorldInterface) => {
	const result = await createTestHttpServer(() => createMcpServer(testConfig));
	world.httpServer = result.httpServer;
	world.baseUrl = result.baseUrl;
	world.transports = result.transports;
});

When("I send an initialize request via HTTP", async (world: QuickPickleWorldInterface) => {
	const response = await fetch(`${world.baseUrl}/mcp`, {
		method: "POST",
		headers: {
			...MCP_HEADERS,
		},
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method: "initialize",
			params: {
				protocolVersion: "2025-03-26",
				capabilities: {},
				clientInfo: { name: "test", version: "1.0.0" },
			},
		}),
	});
	world.sessionId = response.headers.get("mcp-session-id") ?? undefined;
	world.httpResponse = response;
});

Then("I should receive a valid session ID", (world: QuickPickleWorldInterface) => {
	expect(world.sessionId).toBeDefined();
	expect(world.sessionId!.length).toBeGreaterThan(0);
});

When("I list tools via HTTP", async (world: QuickPickleWorldInterface) => {
	const response = await fetch(`${world.baseUrl}/mcp`, {
		method: "POST",
		headers: {
			...MCP_HEADERS,
			"mcp-session-id": world.sessionId!,
		},
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 2,
			method: "tools/list",
			params: {},
		}),
	});
	const payload = await parseSseResponse(response);
	world.toolNames = parseToolsListPayload(payload);
});

Then(
	"the HTTP tool list should contain {string} and {string}",
	(world: QuickPickleWorldInterface, tool1: string, tool2: string) => {
		expect(world.toolNames).toContain(tool1);
		expect(world.toolNames).toContain(tool2);
	},
);

When("I call {string} via HTTP", async (world: QuickPickleWorldInterface, toolName: string) => {
	const response = await fetch(`${world.baseUrl}/mcp`, {
		method: "POST",
		headers: {
			...MCP_HEADERS,
			"mcp-session-id": world.sessionId!,
		},
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 3,
			method: "tools/call",
			params: { name: toolName, arguments: {} },
		}),
	});
	const payload = await parseSseResponse(response);
	const textContent = parseToolCallText(payload);
	if (textContent) {
		try {
			world.allCoffees = parseCoffeeArrayJson(textContent);
		} catch {
			world.allCoffees = [];
		}
	}
});

Then(
	"the HTTP response should contain {int} coffees",
	(world: QuickPickleWorldInterface, count: number) => {
		expect(world.allCoffees).toHaveLength(count);
	},
);

When("I request the health endpoint", async (world: QuickPickleWorldInterface) => {
	world.httpResponse = await fetch(`${world.baseUrl}/health`);
});

Then("the health response should be ok", async (world: QuickPickleWorldInterface) => {
	expect(world.httpResponse!.status).toBe(200);
	const status = parseHealthStatus(await world.httpResponse!.json());
	expect(status).toBe("ok");
});

When("I terminate the session via HTTP", async (world: QuickPickleWorldInterface) => {
	world.httpResponse = await fetch(`${world.baseUrl}/mcp`, {
		method: "DELETE",
		headers: {
			"mcp-session-id": world.sessionId!,
		},
	});
});

Then("the session should be terminated", (world: QuickPickleWorldInterface) => {
	expect(world.httpResponse!.status).toBe(200);
});
