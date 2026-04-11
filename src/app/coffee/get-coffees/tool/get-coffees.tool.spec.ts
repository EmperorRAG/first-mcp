import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerGetCoffeesTool } from "./get-coffees.tool.js";
import type { GetCoffeesController } from "../controller/get-coffees.controller.js";

describe("registerGetCoffeesTool", () => {
	it("registers the get-coffees tool on the server", () => {
		const server = new McpServer({ name: "test", version: "0.0.0" });
		const spy = vi.spyOn(server, "registerTool");

		const mockController = {
			handle: vi.fn(() => ({
				content: [{ type: "text" as const, text: "[]" }],
			})),
		} as unknown as GetCoffeesController;

		registerGetCoffeesTool(server, mockController);

		expect(spy).toHaveBeenCalledOnce();
		expect(spy).toHaveBeenCalledWith(
			"get-coffees",
			expect.objectContaining({ description: "Get a list of all coffees" }),
			expect.any(Function),
		);
	});
});
