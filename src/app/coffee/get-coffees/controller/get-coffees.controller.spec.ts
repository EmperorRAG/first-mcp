/**
 * Unit tests for `GetCoffeesController.handle()` JSON array response formatting.
 *
 * @module
 */
import { describe, it, expect, vi } from "vitest";
import { GetCoffeesController } from "./get-coffees.controller.js";
import { defaultCoffeeList } from "../../../testing/factory/coffee.factory.js";
import { createMockGetCoffeesService } from "../../../testing/factory/mock-coffee.factory.js";
import { parseFirstToolTextAsJson } from "../../../testing/utility/tool-response.utility.js";

describe("GetCoffeesController", () => {
	const mockCoffees = defaultCoffeeList;
	const mockService = createMockGetCoffeesService(mockCoffees);

	it("returns a ToolTextResponse with JSON array", () => {
		const controller = new GetCoffeesController(mockService);
		const result = controller.handle();

		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");

		const parsed = parseFirstToolTextAsJson(result);
		expect(parsed).toEqual(mockCoffees);
		expect(vi.isMockFunction(mockService.execute)).toBe(true);
	});
});
