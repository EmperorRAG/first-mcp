import { describe, it, expect, vi } from "vitest";
import { GetCoffeesController } from "./get-coffees.controller.js";
import type { GetCoffeesService } from "../service/get-coffees.service.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

describe("GetCoffeesController", () => {
	const mockCoffees: Coffee[] = [
		{ id: 1, name: "Flat White", size: "Medium", price: 4.5, iced: false, caffeineMg: 130 },
		{ id: 2, name: "Espresso", size: "Small", price: 2.5, iced: false, caffeineMg: 64 },
	];

	const mockService = {
		execute: vi.fn(() => mockCoffees),
	} as unknown as GetCoffeesService;

	it("returns a ToolTextResponse with JSON array", () => {
		const controller = new GetCoffeesController(mockService);
		const result = controller.handle();

		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");

		const parsed: unknown = JSON.parse(result.content[0].text);
		expect(parsed).toEqual(mockCoffees);
	});
});
