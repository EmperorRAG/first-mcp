import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerGetACoffeeTool } from "./get-a-coffee.tool.js";
import type {
	GetACoffeeControllerClass,
} from "../controller/get-a-coffee.controller.js";

describe("registerGetACoffeeTool", () => {
	it("registers the get-a-coffee tool on the server", async () => {
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const originalRegisterTool = server.registerTool.bind(server);
		let capturedHandler: ((...args: unknown[]) => unknown) | undefined;
		const spy = vi.spyOn(server, "registerTool").mockImplementation(
			(name, config, cb) => {
				capturedHandler = cb;
				return originalRegisterTool(name, config, cb);
			},
		);

		const mockResponse: ReturnType<GetACoffeeControllerClass["handle"]> = {
			content: [{ type: "text", text: "{}" }],
		};
		const mockController: GetACoffeeControllerClass = {
			handle: vi.fn(() => mockResponse),
		};

		registerGetACoffeeTool(server, mockController);

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith(
			"get-a-coffee",
			expect.objectContaining({
				description: "Retrieve the data for a specific coffee based on its name",
			}),
			expect.any(Function),
		);

		expect(capturedHandler).toBeDefined();
		if (!capturedHandler) {
			throw new Error("Expected registerTool callback to be a function");
		}

		const result = await Promise.resolve(capturedHandler({ name: "Flat White" }));
		expect(mockController.handle).toHaveBeenCalledWith({ name: "Flat White" });
		expect(result).toEqual(mockResponse);
	});
});
