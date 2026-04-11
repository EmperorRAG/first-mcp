import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerGetACoffeeTool } from "./get-a-coffee.tool.js";
import type { GetACoffeeController } from "../controller/get-a-coffee.controller.js";

describe("registerGetACoffeeTool", () => {
	it("registers the get-a-coffee tool on the server", () => {
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const spy = vi.spyOn(server, "registerTool");

		const mockController = {
			handle: vi.fn(() => ({
				content: [{ type: "text" as const, text: "{}" }],
			})),
		} as unknown as GetACoffeeController;

		registerGetACoffeeTool(server, mockController);

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith(
			"get-a-coffee",
			expect.objectContaining({
				description: "Retrieve the data for a specific coffee based on its name",
			}),
			expect.any(Function),
		);
	});
});
