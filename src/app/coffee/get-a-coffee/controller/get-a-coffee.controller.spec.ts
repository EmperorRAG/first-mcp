import { describe, it, expect, vi } from "vitest";
import { GetACoffeeController } from "./get-a-coffee.controller.js";
import type { GetACoffeeServiceClass } from "../service/get-a-coffee.service.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

describe("GetACoffeeController", () => {
	const flatWhite: Coffee = {
		id: 1, name: "Flat White", size: "Medium", price: 4.5, iced: false, caffeineMg: 130,
	};

	function createController(coffee: Coffee | undefined) {
		const mockService = {
			execute: vi.fn(() => coffee),
		} as unknown as GetACoffeeServiceClass;
		return new GetACoffeeController(mockService);
	}

	it("returns coffee JSON when found", () => {
		const controller = createController(flatWhite);
		const result = controller.handle({ name: "Flat White" });

		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");
		expect(JSON.parse(result.content[0].text)).toEqual(flatWhite);
	});

	it("returns 'Coffee not found' when not found", () => {
		const controller = createController(undefined);
		const result = controller.handle({ name: "nonexistent" });

		expect(result.content).toHaveLength(1);
		expect(result.content[0].text).toBe("Coffee not found");
	});
});
