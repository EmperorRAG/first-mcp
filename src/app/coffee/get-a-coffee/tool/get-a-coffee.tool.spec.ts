import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerGetACoffeeTool } from "./get-a-coffee.tool.js";
import {
	captureRegisterToolHandler,
	createMockGetACoffeeController,
} from "../../../testing/factory/mock-coffee.factory.js";
import { createToolTextResponse } from "../../../testing/utility/tool-response.utility.js";

describe("registerGetACoffeeTool", () => {
	it("registers the get-a-coffee tool on the server", async () => {
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const capture = captureRegisterToolHandler(server);

		const expectedResponse = createToolTextResponse("{}");
		const mockController = createMockGetACoffeeController("{}");

		registerGetACoffeeTool(server, mockController);

		expect(capture.getCallCount()).toBe(1);
		expect(capture.getRegisteredToolName()).toBe("get-a-coffee");
		expect(capture.getRegisteredToolConfig()).toEqual(
			expect.objectContaining({
				description:
					"Retrieve the data for a specific coffee based on its name",
			}),
		);

		const handler = capture.getHandler();
		const result = await Promise.resolve(handler({ name: "Flat White" }));
		expect(mockController.handle).toHaveBeenCalledWith({ name: "Flat White" });
		expect(result).toEqual(expectedResponse);
		expect(vi.isMockFunction(mockController.handle)).toBe(true);
	});
});
