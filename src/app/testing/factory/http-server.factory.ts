/**
 * Factory for spinning up a test Express HTTP server with MCP Streamable HTTP transport.
 *
 * @module
 */
import { randomUUID } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import cors from "cors";
import { getSessionId } from "../utility/reflect.utility.js";

/**
 * Result of spinning up a test HTTP server with MCP transport support.
 */
export interface TestHttpServerSetup {
	/** The Node.js HTTP server instance. */
	httpServer: HttpServer;
	/** Base URL (`http://127.0.0.1:{port}`) for sending requests. */
	baseUrl: string;
	/** Map of session IDs to their active transports. */
	transports: Map<string, NodeStreamableHTTPServerTransport>;
}

/**
 * Creates an Express HTTP server wired with MCP Streamable HTTP transport, session
 * management, health endpoint, and SSE backward compatibility for E2E tests.
 *
 * @remarks
 * The server listens on an OS-assigned port (`0`) and resolves with the base URL.
 * Callers must close `httpServer` after the test to free the port.
 *
 * @param createServer - Factory function that returns a fresh McpServer per session.
 * @returns A promise resolving to the server, base URL, and active transport map.
 */
export function createTestHttpServer(
	createServer: () => McpServer,
): Promise<TestHttpServerSetup> {
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

				const server = createServer();
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