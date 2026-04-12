/**
 * Shared BDD step definitions for the coffee domain.
 * Provides cleanup, constants, domain registration, and tool listing steps used across integration, contract, and E2E features.
 *
 * @module
 */
import {
	Given,
	When,
	After,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { Client } from "@modelcontextprotocol/client";
import { registerCoffeeDomain } from "../coffee.domain.js";
import type { Coffee } from "../shared/type/coffee.types.js";
import { createTestServerConfig } from "../../testing/factory/server-config.factory.js";
import {
	getRegisteredTools,
} from "../../testing/utility/mcp-server-introspection.utility.js";
import type { Server as HttpServer } from "node:http";

const testConfig = createTestServerConfig();

const MCP_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json, text/event-stream",
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

Given("the coffee domain is registered on a server", (world: QuickPickleWorldInterface) => {
	world.server = new McpServer({ name: "test", version: "0.0.0" });
	registerCoffeeDomain(world.server);
});

When("I list the registered tools", (world: QuickPickleWorldInterface) => {
	const tools = getRegisteredTools(world.server);
	world.toolNames = Object.keys(tools);
});

export { testConfig, MCP_HEADERS };
