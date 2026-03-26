import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { z } from "zod";

const server = new McpServer({
	name: "coffee-mate",
	version: "1.0.0",
});

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

async function main() {
	const useStdio = process.argv.includes("--stdio");

	if (useStdio) {
		const transport = new StdioServerTransport();
		await server.connect(transport);
		console.error("MCP Server running on stdio");
	} else {
		const app = express();
		const PORT = parseInt(process.env["PORT"] || "3001", 10);

		const transports = new Map<string, SSEServerTransport>();

		app.get("/health", (_req, res) => {
			res.status(200).json({ status: "ok" });
		});

		app.get("/sse", async (req, res) => {
			const transport = new SSEServerTransport("/messages", res);
			transports.set(transport.sessionId, transport);

			res.on("close", () => {
				transports.delete(transport.sessionId);
			});

			await server.connect(transport);
		});

		app.post("/messages", express.json(), async (req, res) => {
			const sessionId = req.query["sessionId"] as string;
			const transport = transports.get(sessionId);

			if (!transport) {
				res.status(400).json({ error: "Unknown session" });
				return;
			}

			await transport.handlePostMessage(req, res, req.body);
		});

		app.listen(PORT, () => {
			console.error(`MCP Server running on http://0.0.0.0:${PORT}`);
		});
	}
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
