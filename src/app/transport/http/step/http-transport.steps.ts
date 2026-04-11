import {
	Given,
	When,
	Then,
	After,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { expect } from "vitest";
import { randomUUID } from "node:crypto";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import cors from "cors";
import { createMcpServer } from "../../../server/mcp-server/mcp-server.js";
import type { ServerConfig } from "../../../config/mcp-server/mcp-server.config.js";
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
		httpServer: HttpServer;
		baseUrl: string;
		transports: Map<string, NodeStreamableHTTPServerTransport>;
		httpResponse: Response | undefined;
		responseBody: Record<string, unknown>;
	}
}

function getSessionId(headers: IncomingHttpHeaders): string | undefined {
	const value = headers["mcp-session-id"];
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

function toResponseBody(value: unknown): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(Object.entries(value));
}

function startTestHttpServer(): Promise<{
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

After(async (world: QuickPickleWorldInterface) => {
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
				// ignore
			}
		}
	}
});

// Integration steps

Given("an HTTP transport server is started", async (world: QuickPickleWorldInterface) => {
	const result = await startTestHttpServer();
	world.httpServer = result.httpServer;
	world.baseUrl = result.baseUrl;
	world.transports = result.transports;
});

When("I request GET {string}", async (world: QuickPickleWorldInterface, path: string) => {
	const response = await fetch(`${world.baseUrl}${path}`);
	world.httpResponse = response;
	try {
		world.responseBody = toResponseBody(await response.clone().json());
	} catch {
		world.responseBody = {};
	}
});

When(
	"I send a POST to {string} with an invalid body",
	async (world: QuickPickleWorldInterface, path: string) => {
		const response = await fetch(`${world.baseUrl}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json, text/event-stream",
			},
			body: JSON.stringify({ invalid: true }),
		});
		world.httpResponse = response;
		try {
			world.responseBody = toResponseBody(await response.clone().json());
		} catch {
			world.responseBody = {};
		}
	},
);

When("I send DELETE to {string}", async (world: QuickPickleWorldInterface, path: string) => {
	const response = await fetch(`${world.baseUrl}${path}`, {
		method: "DELETE",
	});
	world.httpResponse = response;
	try {
		world.responseBody = toResponseBody(await response.clone().json());
	} catch {
		world.responseBody = {};
	}
});

Then("the response status should be {int}", (world: QuickPickleWorldInterface, status: number) => {
	expect(world.httpResponse!.status).toBe(status);
});

Then(
	"the response body should have status {string}",
	(world: QuickPickleWorldInterface, status: string) => {
		expect(world.responseBody.status).toBe(status);
	},
);

// Contract steps

Then(
	"the response content-type should be {string}",
	(world: QuickPickleWorldInterface, contentType: string) => {
		const ct = world.httpResponse!.headers.get("content-type") ?? "";
		expect(ct).toContain(contentType);
	},
);

Then(
	"the response body should have a {string} field of type {string}",
	(world: QuickPickleWorldInterface, field: string, type: string) => {
		expect(world.responseBody).toHaveProperty(field);
		expect(typeof world.responseBody[field]).toBe(type);
	},
);

Then(
	"the response body should have an {string} field",
	(world: QuickPickleWorldInterface, field: string) => {
		expect(world.responseBody).toHaveProperty(field);
	},
);
