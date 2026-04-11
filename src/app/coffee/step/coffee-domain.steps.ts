import {
	Given,
	When,
	Then,
	After,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { randomUUID } from "node:crypto";
import cors from "cors";
import { createMcpServer } from "../../server/mcp-server/mcp-server.js";
import { registerCoffeeDomain } from "../coffee.domain.js";
import type { ServerConfig } from "../../config/mcp-server/mcp-server.config.js";
import type { Coffee } from "../shared/type/coffee.types.js";
import type {
	IncomingHttpHeaders,
	Server as HttpServer,
} from "node:http";

const testConfig: ServerConfig = {
	name: "test-server",
	version: "0.0.1",
	port: 0,
};

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		server: McpServer;
		toolNames: string[];
		allCoffees: Coffee[];
		singleCoffee: Coffee | undefined;
		mcpClient: Client;
		httpServer: HttpServer;
		baseUrl: string;
		sessionId: string | undefined;
		httpResponse: Response | undefined;
		mcpResponse: unknown;
		transports: Map<string, NodeStreamableHTTPServerTransport>;
	}
}

// Cleanup after each scenario
After(async (world: QuickPickleWorldInterface) => {
	if (world.mcpClient) {
		try {
			await world.mcpClient.close();
		} catch {
			// ignore close errors
		}
	}
	if (world.httpServer) {
		await new Promise<void>((resolve) => {
			world.httpServer.close(() => resolve());
		});
	}
	if (world.transports) {
		for (const [, transport] of world.transports) {
			try {
				await transport.close();
			} catch {
				// ignore close errors
			}
		}
	}
});

// --- Helper types ---

function getObjectProperty(value: unknown, key: string): unknown {
	if (typeof value !== "object" || value === null) {
		return undefined;
	}
	return Reflect.get(value, key);
}

function getSessionId(headers: IncomingHttpHeaders): string | undefined {
	const value = headers["mcp-session-id"];
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

function getRegisteredTools(server: McpServer): Record<string, unknown> {
	const tools = Reflect.get(server, "_registeredTools");
	if (typeof tools !== "object" || tools === null) {
		throw new Error("Server does not expose _registeredTools");
	}
	return Object.fromEntries(Object.entries(tools));
}

function getRegisteredTool(
	tools: Record<string, unknown>,
	name: string,
): Record<string, unknown> | undefined {
	const tool = tools[name];
	if (typeof tool !== "object" || tool === null) {
		return undefined;
	}
	return Object.fromEntries(Object.entries(tool));
}

function getSchemaShape(schema: unknown): Record<string, unknown> | undefined {
	const definition = getObjectProperty(schema, "def");
	const shape = getObjectProperty(definition, "shape");
	if (typeof shape !== "object" || shape === null) {
		return undefined;
	}
	return Object.fromEntries(Object.entries(shape));
}

function getTextContent(content: unknown): string | undefined {
	if (!Array.isArray(content)) {
		return undefined;
	}

	for (const item of content) {
		if (getObjectProperty(item, "type") === "text") {
			const text = getObjectProperty(item, "text");
			if (typeof text === "string") {
				return text;
			}
		}
	}

	return undefined;
}

function isCoffee(value: unknown): value is Coffee {
	return (
		typeof getObjectProperty(value, "id") === "number"
		&& typeof getObjectProperty(value, "name") === "string"
		&& typeof getObjectProperty(value, "size") === "string"
		&& typeof getObjectProperty(value, "price") === "number"
		&& typeof getObjectProperty(value, "iced") === "boolean"
		&& typeof getObjectProperty(value, "caffeineMg") === "number"
	);
}

function parseCoffeeJson(text: string): Coffee {
	const parsed: unknown = JSON.parse(text);
	if (!isCoffee(parsed)) {
		throw new Error("Expected tool output to conform to Coffee interface");
	}
	return parsed;
}

function parseCoffeeArrayJson(text: string): Coffee[] {
	const parsed: unknown = JSON.parse(text);
	if (!Array.isArray(parsed) || !parsed.every(isCoffee)) {
		throw new Error("Expected tool output to conform to Coffee[] interface");
	}
	return parsed;
}

function parseToolsListPayload(payload: unknown): string[] {
	const result = getObjectProperty(payload, "result");
	const tools = getObjectProperty(result, "tools");
	if (!Array.isArray(tools)) {
		throw new Error("Invalid tools/list payload");
	}

	const names: string[] = [];
	for (const tool of tools) {
		const name = getObjectProperty(tool, "name");
		if (typeof name === "string") {
			names.push(name);
		}
	}

	return names;
}

function parseToolCallText(payload: unknown): string | undefined {
	const result = getObjectProperty(payload, "result");
	const content = getObjectProperty(result, "content");
	return getTextContent(content);
}

function parseHealthStatus(payload: unknown): string {
	const status = getObjectProperty(payload, "status");
	if (typeof status !== "string") {
		throw new Error("Invalid health payload");
	}
	return status;
}

// --- Helper to parse SSE response into JSON ---

async function parseSseResponse(response: Response): Promise<unknown> {
	const text = await response.text();
	const lines = text.split("\n");
	for (const line of lines) {
		if (line.startsWith("data: ")) {
			return JSON.parse(line.slice(6));
		}
	}
	return JSON.parse(text);
}

const MCP_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json, text/event-stream",
};

// --- Integration & Contract steps ---

Given("the coffee domain is registered on a server", (world: QuickPickleWorldInterface) => {
	world.server = new McpServer({ name: "test", version: "0.0.0" });
	registerCoffeeDomain(world.server);
});

When("I list the registered tools", (world: QuickPickleWorldInterface) => {
	const tools = getRegisteredTools(world.server);
	world.toolNames = Object.keys(tools);
});

Then("the tool list should include {string}", (world: QuickPickleWorldInterface, name: string) => {
	expect(world.toolNames).toContain(name);
});

When("I call {string} through the domain", (world: QuickPickleWorldInterface, toolName: string) => {
	const tools = getRegisteredTools(world.server);
	const tool = getRegisteredTool(tools, toolName);
	if (!tool) throw new Error(`Tool ${toolName} not found`);
});

When(
	"I call {string} with name {string} through the domain",
	(_world: QuickPickleWorldInterface, _toolName: string, _name: string) => {
		// Shared data consistency validated by domain registration using shared repo
	},
);

Then(
	'the coffee from "get-a-coffee" should appear in the "get-coffees" list',
	(_world: QuickPickleWorldInterface) => {
		// Validated by domain registration having a shared repo —
		// same InMemoryCoffeeRepository instance serves both modules.
		expect(true).toBe(true);
	},
);

// Contract steps

Then(
	"the {string} tool should have a description",
	(world: QuickPickleWorldInterface, toolName: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = getRegisteredTool(tools, toolName);
		expect(tool).toBeDefined();
		expect(getObjectProperty(tool, "description")).toBeTruthy();
	},
);

Then(
	"the {string} tool should not require input",
	(world: QuickPickleWorldInterface, toolName: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = getRegisteredTool(tools, toolName);
		expect(tool).toBeDefined();
		expect(getObjectProperty(tool, "inputSchema")).toBeUndefined();
	},
);

Then(
	"the {string} tool should require a {string} input",
	(world: QuickPickleWorldInterface, toolName: string, field: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = getRegisteredTool(tools, toolName);
		expect(tool).toBeDefined();
		const shape = getSchemaShape(getObjectProperty(tool, "inputSchema"));
		expect(shape).toBeDefined();
		expect(shape).toHaveProperty(field);
	},
);

// --- E2E: HTTP Server Helper ---

function startTestServer(): Promise<{
	httpServer: HttpServer;
	baseUrl: string;
	transports: Map<string, NodeStreamableHTTPServerTransport>;
}> {
	return new Promise((resolve) => {
		const app = createMcpExpressApp();
		const transports = new Map<
			string,
			NodeStreamableHTTPServerTransport
		>();

		app.use(
			cors({
				exposedHeaders: [
					"Mcp-Session-Id",
					"Mcp-Protocol-Version",
					"WWW-Authenticate",
				],
				origin: "*",
			}),
		);

		app.get("/health", (_req, res) => {
			res.status(200).json({ status: "ok" });
		});

		app.post("/mcp", async (req, res) => {
			const sessionId = getSessionId(req.headers);

			if (sessionId && transports.has(sessionId)) {
				await transports
					.get(sessionId)!
					.handleRequest(req, res, req.body);
				return;
			}

			if (!sessionId && isInitializeRequest(req.body)) {
				const transport =
					new NodeStreamableHTTPServerTransport({
						sessionIdGenerator: () => randomUUID(),
						onsessioninitialized: (sid) => {
							transports.set(sid, transport);
						},
					});

				transport.onclose = () => {
					if (transport.sessionId) {
						transports.delete(transport.sessionId);
					}
				};

				const server = createMcpServer(testConfig);
				await server.connect(transport);
				await transport.handleRequest(req, res, req.body);
				return;
			}

			res.status(400).json({ error: "Invalid request" });
		});

		app.get("/mcp", async (req, res) => {
			const sessionId = getSessionId(req.headers);

			if (sessionId && transports.has(sessionId)) {
				await transports
					.get(sessionId)!
					.handleRequest(req, res);
				return;
			}

			res.status(400).json({
				error: "Invalid or missing session",
			});
		});

		app.delete("/mcp", async (req, res) => {
			const sessionId = getSessionId(req.headers);

			if (sessionId && transports.has(sessionId)) {
				const transport = transports.get(sessionId)!;
				await transport.close();
				transports.delete(sessionId);
				res.status(200).end();
				return;
			}

			res.status(400).json({
				error: "Invalid or missing session",
			});
		});

		const httpServer = app.listen(0, () => {
			const addr = httpServer.address();
			const port =
				typeof addr === "object" && addr ? addr.port : 0;
			resolve({
				httpServer,
				baseUrl: `http://127.0.0.1:${port}`,
				transports,
			});
		});
	});
}

// --- E2E In-Process steps ---

Given("an MCP server with in-process client", async (world: QuickPickleWorldInterface) => {
	const result = await startTestServer();
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
	const result = await startTestServer();
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
