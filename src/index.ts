import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
