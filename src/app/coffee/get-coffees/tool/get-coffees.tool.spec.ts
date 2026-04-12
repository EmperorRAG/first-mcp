/**
 * Unit tests for `registerGetCoffeesTool` wiring, tool configuration, and handler invocation.
 *
 * @module
 */
import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerGetCoffeesTool } from "./get-coffees.tool.js";
import {
	captureRegisterToolHandler,
	createMockGetCoffeesController,
} from "../../../testing/factory/mock-coffee.factory.js";
import { createToolTextResponse } from "../../../testing/utility/tool-response.utility.js";

describe("registerGetCoffeesTool", () => {
	it("registers the get-coffees tool on the server", async () => {
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const capture = captureRegisterToolHandler(server);

		const expectedResponse = createToolTextResponse("[]");
		const mockController = createMockGetCoffeesController("[]");

		registerGetCoffeesTool(server, mockController);

		expect(capture.getCallCount()).toBe(1);
		expect(capture.getRegisteredToolName()).toBe("get-coffees");
		expect(capture.getRegisteredToolConfig()).toEqual(
			expect.objectContaining({ description: "Get a list of all coffees" }),
		);

		const handler = capture.getHandler();
		const result = await Promise.resolve(handler());
		expect(mockController.handle).toHaveBeenCalledOnce();
		expect(result).toEqual(expectedResponse);
		expect(vi.isMockFunction(mockController.handle)).toBe(true);
	});
});
