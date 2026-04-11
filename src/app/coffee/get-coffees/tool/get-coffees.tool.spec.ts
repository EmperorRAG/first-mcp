import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerGetCoffeesTool } from "./get-coffees.tool.js";
import type {
	GetCoffeesControllerClass,
} from "../controller/get-coffees.controller.js";

describe("registerGetCoffeesTool", () => {
	it("registers the get-coffees tool on the server", async () => {
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const originalRegisterTool = server.registerTool.bind(server);
		let capturedHandler: ((...args: unknown[]) => unknown) | undefined;
		const spy = vi.spyOn(server, "registerTool").mockImplementation(
			(name, config, cb) => {
				capturedHandler = cb;
				return originalRegisterTool(name, config, cb);
			},
		);

		const mockResponse: ReturnType<GetCoffeesControllerClass["handle"]> = {
			content: [{ type: "text", text: "[]" }],
		};
		const mockController: GetCoffeesControllerClass = {
			handle: vi.fn(() => mockResponse),
		};

		registerGetCoffeesTool(server, mockController);

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith(
			"get-coffees",
			expect.objectContaining({ description: "Get a list of all coffees" }),
			expect.any(Function),
		);

		expect(capturedHandler).toBeDefined();
		if (!capturedHandler) {
			throw new Error("Expected registerTool callback to be a function");
		}

		const result = await Promise.resolve(capturedHandler());
		expect(mockController.handle).toHaveBeenCalledOnce();
		expect(result).toEqual(mockResponse);
	});
});
