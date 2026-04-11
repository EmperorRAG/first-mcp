import { randomUUID } from "node:crypto";
import {
	McpServer,
	StdioServerTransport,
	isInitializeRequest,
} from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import cors from "cors";
import * as z from "zod/v4";

export const coffeeDrinks = [
	{
		id: 1,
		name: "Flat White",
		size: "Medium",
		price: 4.5,
		iced: false,
		caffeineMg: 130,
	},
	{
		id: 2,
		name: "Cappuccino",
		size: "Small",
		price: 3.75,
		iced: false,
		caffeineMg: 80,
	},
	{
		id: 3,
		name: "Latte",
		size: "Large",
		price: 5.25,
		iced: true,
		caffeineMg: 150,
	},
	{
		id: 4,
		name: "Espresso",
		size: "Small",
		price: 2.5,
		iced: false,
		caffeineMg: 64,
	},
];

function createServer(): McpServer {
	const server = new McpServer({
		name: "coffee-mate",
		version: "1.0.0",
	});

	server.registerTool(
		"get-coffees",
		{
			description: "Get a list of all coffees",
		},
		async () => {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(coffeeDrinks),
					},
				],
			};
		},
	);

	server.registerTool(
		"get-a-coffee",
		{
			description: "Retrieve the data for a specific coffee based on its name",
			inputSchema: z.object({ name: z.string() }),
		},
		async ({ name }) => {
			const coffee = coffeeDrinks.find((c) => c.name === name);
			if (!coffee) {
				return {
					content: [
						{
							type: "text",
							text: "Coffee not found",
						},
					],
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(coffee),
					},
				],
			};
		},
	);

	return server;
}

async function main() {
	const useStdio = process.argv.includes("--stdio");

	if (useStdio) {
		const server = createServer();
		const transport = new StdioServerTransport();
		await server.connect(transport);
		console.error("MCP Server running on stdio");
	} else {
		const app = createMcpExpressApp();
		const PORT = parseInt(process.env["PORT"] || "3001", 10);

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

		const httpServer = app.listen(PORT, () => {
			console.error(`MCP Server running on http://0.0.0.0:${PORT}`);
		});

		process.on("SIGINT", async () => {
			httpServer.close();
			for (const [, transport] of transports) {
				await transport.close();
			}
			transports.clear();
			process.exit(0);
		});
	}
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
