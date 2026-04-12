/**
 * BDD step definitions for the HTTP transport component.
 * Covers integration and contract scenarios for session management, health endpoint, and SSE.
 *
 * @module
 */
import {
	Given,
	When,
	Then,
	After,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { expect } from "vitest";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { createMcpServer } from "../../../server/mcp-server/mcp-server.js";
import { createTestServerConfig } from "../../../testing/factory/server-config.factory.js";
import { createTestHttpServer } from "../../../testing/factory/http-server.factory.js";
import { toResponseBody } from "../../../testing/utility/reflect.utility.js";
import type { Server as HttpServer } from "node:http";

const testConfig = createTestServerConfig();

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		httpServer: HttpServer;
		baseUrl: string;
		transports: Map<string, NodeStreamableHTTPServerTransport>;
		httpResponse: Response | undefined;
		responseBody: Record<string, unknown>;
	}
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
	const result = await createTestHttpServer(() => createMcpServer(testConfig));
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
