import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/server";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import cors from "cors";

export function startHttpServer(
	createServer: () => McpServer,
	port: number,
): void {
	const app = createMcpExpressApp({ host: "0.0.0.0" });

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

	const transports = new Map<
		string,
		NodeStreamableHTTPServerTransport
	>();

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
			const transport = new NodeStreamableHTTPServerTransport({
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

		res.status(400).json({ error: "Invalid or missing session" });
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

		res.status(400).json({ error: "Invalid or missing session" });
	});

	const httpServer = app.listen(port, () => {
		console.error(`MCP Server running on http://0.0.0.0:${port}`);
	});

	process.on("SIGINT", () => {
		httpServer.close();
		const closeAll = async (): Promise<void> => {
			for (const [, transport] of transports) {
				await transport.close();
			}
			transports.clear();
			process.exit(0);
		};
		void closeAll();
	});
}
