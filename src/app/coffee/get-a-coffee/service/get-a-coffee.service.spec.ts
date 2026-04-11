import { describe, it, expect, vi } from "vitest";
import { GetACoffeeService } from "./get-a-coffee.service.js";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";
import type { Coffee } from "../../shared/type/coffee.types.js";

describe("GetACoffeeService", () => {
	const flatWhite: Coffee = {
		id: 1, name: "Flat White", size: "Medium", price: 4.5, iced: false, caffeineMg: 130,
	};

	const mockRepo: CoffeeRepository = {
		findAll: vi.fn(),
		findByName: vi.fn((name: string) =>
			name === "Flat White" ? flatWhite : undefined,
		),
	};

	it("returns a coffee when found", () => {
		const service = new GetACoffeeService(mockRepo);
		const result = service.execute("Flat White");
		expect(result).toEqual(flatWhite);
		expect(mockRepo.findByName).toHaveBeenCalledWith("Flat White");
	});

	it("returns undefined when not found", () => {
		const service = new GetACoffeeService(mockRepo);
		const result = service.execute("nonexistent");
		expect(result).toBeUndefined();
	});
});
