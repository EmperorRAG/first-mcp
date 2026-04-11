import { Given, When, Then, After } from "quickpickle";
import { expect } from "vitest";
import { randomUUID } from "node:crypto";
import { McpServer, isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import cors from "cors";
import { createServer } from "../../../server/server.js";
import type { Server as HttpServer } from "node:http";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		httpServer: HttpServer;
		baseUrl: string;
		transports: Map<string, NodeStreamableHTTPServerTransport>;
		httpResponse: Response;
		responseBody: Record<string, unknown>;
	}
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

After(async (world) => {
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

Given("an HTTP transport server is started", async (world) => {
	const result = await startTestHttpServer();
	world.httpServer = result.httpServer;
	world.baseUrl = result.baseUrl;
	world.transports = result.transports;
});

When("I request GET {string}", async (world, path: string) => {
	world.httpResponse = await fetch(`${world.baseUrl}${path}`);
	try {
		world.responseBody = (await world.httpResponse.clone().json()) as Record<
			string,
			unknown
		>;
	} catch {
		world.responseBody = {};
	}
});

When(
	"I send a POST to {string} with an invalid body",
	async (world, path: string) => {
		world.httpResponse = await fetch(`${world.baseUrl}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json, text/event-stream",
			},
			body: JSON.stringify({ invalid: true }),
		});
		try {
			world.responseBody =
				(await world.httpResponse.clone().json()) as Record<
					string,
					unknown
				>;
		} catch {
			world.responseBody = {};
		}
	},
);

When("I send DELETE to {string}", async (world, path: string) => {
	world.httpResponse = await fetch(`${world.baseUrl}${path}`, {
		method: "DELETE",
	});
	try {
		world.responseBody = (await world.httpResponse.clone().json()) as Record<
			string,
			unknown
		>;
	} catch {
		world.responseBody = {};
	}
});

Then("the response status should be {int}", (world, status: number) => {
	expect(world.httpResponse.status).toBe(status);
});

Then(
	"the response body should have status {string}",
	(world, status: string) => {
		expect(world.responseBody["status"]).toBe(status);
	},
);

// Contract steps

Then(
	"the response content-type should be {string}",
	(world, contentType: string) => {
		const ct = world.httpResponse.headers.get("content-type") ?? "";
		expect(ct).toContain(contentType);
	},
);

Then(
	"the response body should have a {string} field of type {string}",
	(world, field: string, type: string) => {
		expect(world.responseBody).toHaveProperty(field);
		expect(typeof world.responseBody[field]).toBe(type);
	},
);

Then(
	"the response body should have an {string} field",
	(world, field: string) => {
		expect(world.responseBody).toHaveProperty(field);
	},
);
