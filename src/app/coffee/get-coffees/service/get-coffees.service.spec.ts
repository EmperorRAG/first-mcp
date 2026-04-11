import { describe, it, expect, vi } from "vitest";
import { GetCoffeesService } from "./get-coffees.service.js";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

describe("GetCoffeesService", () => {
	const mockCoffees: Coffee[] = [
		{ id: 1, name: "Flat White", size: "Medium", price: 4.5, iced: false, caffeineMg: 130 },
	];

	const mockRepo: CoffeeRepository = {
		findAll: vi.fn(() => mockCoffees),
		findByName: vi.fn(),
	};

	it("delegates to repo.findAll()", () => {
		const service = new GetCoffeesService(mockRepo);
		const result = service.execute();
		expect(result).toBe(mockCoffees);
		expect(mockRepo.findAll).toHaveBeenCalledOnce();
	});
});
