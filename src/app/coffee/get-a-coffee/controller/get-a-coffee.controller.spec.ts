import { describe, it, expect } from "vitest";
import { GetACoffeeController } from "./get-a-coffee.controller.js";
import { flatWhiteCoffee } from "../../../testing/factory/coffee.factory.js";
import { createMockGetACoffeeService } from "../../../testing/factory/mock-coffee.factory.js";
import { parseFirstToolTextAsJson } from "../../../testing/utility/tool-response.utility.js";

describe("GetACoffeeController", () => {
	function createController(coffee: typeof flatWhiteCoffee | undefined) {
		const mockService = createMockGetACoffeeService(coffee);
		return new GetACoffeeController(mockService);
	}

	it("returns coffee JSON when found", () => {
		const controller = createController(flatWhiteCoffee);
		const result = controller.handle({ name: "Flat White" });

		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(parseFirstToolTextAsJson(result)).toEqual(flatWhiteCoffee);
	});

	it("returns 'Coffee not found' when not found", () => {
		const controller = createController(undefined);
		const result = controller.handle({ name: "nonexistent" });

		expect(result.content).toHaveLength(1);
		expect(result.content[0].text).toBe("Coffee not found");
	});
});
