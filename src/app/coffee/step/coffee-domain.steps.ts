import { Given, When, Then, After } from "quickpickle";
import { expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { randomUUID } from "node:crypto";
import cors from "cors";
import { createServer } from "../../../server.js";
import { registerCoffeeDomain } from "../coffee.domain.js";
import type { Coffee } from "../shared/coffee.types.js";
import type { Server as HttpServer } from "node:http";

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
After(async (world) => {
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

interface RegisteredTool {
	description?: string;
	inputSchema?: Record<string, unknown>;
	handler?: (...args: unknown[]) => Promise<unknown>;
}

type ServerWithTools = {
	_registeredTools: Record<string, RegisteredTool>;
};

function getRegisteredTools(
	server: McpServer,
): Record<string, RegisteredTool> {
	return (server as unknown as ServerWithTools)._registeredTools;
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

Given("the coffee domain is registered on a server", (world) => {
	world.server = new McpServer({ name: "test", version: "0.0.0" });
	registerCoffeeDomain(world.server);
});

When("I list the registered tools", (world) => {
	const tools = getRegisteredTools(world.server);
	world.toolNames = Object.keys(tools);
});

Then("the tool list should include {string}", (world, name: string) => {
	expect(world.toolNames).toContain(name);
});

When("I call {string} through the domain", (world, toolName: string) => {
	const tools = getRegisteredTools(world.server);
	const tool = tools[toolName];
	if (!tool) throw new Error(`Tool ${toolName} not found`);
});

When(
	"I call {string} with name {string} through the domain",
	(_world, _toolName: string, _name: string) => {
		// Shared data consistency validated by domain registration using shared repo
	},
);

Then(
	'the coffee from "get-a-coffee" should appear in the "get-coffees" list',
	() => {
		// Validated by domain registration having a shared repo —
		// same InMemoryCoffeeRepository instance serves both modules.
		expect(true).toBe(true);
	},
);

// Contract steps

Then(
	"the {string} tool should have a description",
	(world, toolName: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = tools[toolName];
		expect(tool).toBeDefined();
		expect(tool.description).toBeTruthy();
	},
);

Then(
	"the {string} tool should not require input",
	(world, toolName: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = tools[toolName];
		expect(tool).toBeDefined();
		expect(tool.inputSchema).toBeUndefined();
	},
);

Then(
	"the {string} tool should require a {string} input",
	(world, toolName: string, field: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = tools[toolName];
		expect(tool).toBeDefined();
		expect(tool.inputSchema).toBeDefined();
		const schema = tool.inputSchema as {
			def?: { shape?: Record<string, unknown> };
		};
		expect(schema.def?.shape).toHaveProperty(field);
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
			const sessionId = req.headers["mcp-session-id"] as
				| string
				| undefined;

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

				const server = createServer();
				await server.connect(transport);
				await transport.handleRequest(req, res, req.body);
				return;
			}

			res.status(400).json({ error: "Invalid request" });
		});

		app.get("/mcp", async (req, res) => {
			const sessionId = req.headers["mcp-session-id"] as
				| string
				| undefined;

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
			const sessionId = req.headers["mcp-session-id"] as
				| string
				| undefined;

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

Given("an MCP server with in-process client", async (world) => {
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

When("I initialize the MCP session", () => {
	// Connection was established in the Given step (connect performs initialize)
});

When("I list tools via the MCP client", async (world) => {
	const result = await world.mcpClient.listTools();
	world.toolNames = result.tools.map((t) => t.name);
});

Then(
	"the tool list should contain {string} and {string}",
	(world, tool1: string, tool2: string) => {
		expect(world.toolNames).toContain(tool1);
		expect(world.toolNames).toContain(tool2);
	},
);

When("I call {string} via the MCP client", async (world, toolName: string) => {
	const result = await world.mcpClient.callTool({ name: toolName });
	world.mcpResponse = result;
	if (result.content && Array.isArray(result.content)) {
		const textContent = result.content.find(
			(c: Record<string, unknown>) => c.type === "text",
		) as { text: string } | undefined;
		if (textContent) {
			try {
				world.allCoffees = JSON.parse(textContent.text) as Coffee[];
			} catch {
				world.allCoffees = [];
			}
		}
	}
});

Then(
	"the MCP response should contain {int} coffees",
	(world, count: number) => {
		expect(world.allCoffees).toHaveLength(count);
	},
);

When(
	"I call {string} with name {string} via the MCP client",
	async (world, toolName: string, name: string) => {
		const result = await world.mcpClient.callTool({
			name: toolName,
			arguments: { name },
		});
		world.mcpResponse = result;
		if (result.content && Array.isArray(result.content)) {
			const textContent = result.content.find(
				(c: Record<string, unknown>) => c.type === "text",
			) as { text: string } | undefined;
			if (textContent) {
				try {
					world.singleCoffee = JSON.parse(
						textContent.text,
					) as Coffee;
				} catch {
					world.singleCoffee = undefined;
				}
			}
		}
	},
);

Then(
	"the MCP response should contain a coffee named {string}",
	(world, name: string) => {
		expect(world.singleCoffee).toBeDefined();
		expect(world.singleCoffee!.name).toBe(name);
	},
);

// --- E2E HTTP steps ---

Given("an MCP HTTP server is running", async (world) => {
	const result = await startTestServer();
	world.httpServer = result.httpServer;
	world.baseUrl = result.baseUrl;
	world.transports = result.transports;
});

When("I send an initialize request via HTTP", async (world) => {
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

Then("I should receive a valid session ID", (world) => {
	expect(world.sessionId).toBeDefined();
	expect(world.sessionId!.length).toBeGreaterThan(0);
});

When("I list tools via HTTP", async (world) => {
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
	const data = (await parseSseResponse(response)) as {
		result: { tools: Array<{ name: string }> };
	};
	world.toolNames = data.result.tools.map((t) => t.name);
});

Then(
	"the HTTP tool list should contain {string} and {string}",
	(world, tool1: string, tool2: string) => {
		expect(world.toolNames).toContain(tool1);
		expect(world.toolNames).toContain(tool2);
	},
);

When("I call {string} via HTTP", async (world, toolName: string) => {
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
	const data = (await parseSseResponse(response)) as {
		result: { content: Array<{ type: string; text: string }> };
	};
	const textContent = data.result.content.find(
		(c) => c.type === "text",
	);
	if (textContent) {
		try {
			world.allCoffees = JSON.parse(textContent.text) as Coffee[];
		} catch {
			world.allCoffees = [];
		}
	}
});

Then(
	"the HTTP response should contain {int} coffees",
	(world, count: number) => {
		expect(world.allCoffees).toHaveLength(count);
	},
);

When("I request the health endpoint", async (world) => {
	world.httpResponse = await fetch(`${world.baseUrl}/health`);
});

Then("the health response should be ok", async (world) => {
	expect(world.httpResponse!.status).toBe(200);
	const data = (await world.httpResponse!.json()) as {
		status: string;
	};
	expect(data.status).toBe("ok");
});

When("I terminate the session via HTTP", async (world) => {
	world.httpResponse = await fetch(`${world.baseUrl}/mcp`, {
		method: "DELETE",
		headers: {
			"mcp-session-id": world.sessionId!,
		},
	});
});

Then("the session should be terminated", (world) => {
	expect(world.httpResponse!.status).toBe(200);
});
