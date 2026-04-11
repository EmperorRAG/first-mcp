import { describe, it, expect, vi } from "vitest";
import { GetCoffeesService } from "./get-coffees.service.js";
import { defaultCoffeeList } from "../../../testing/factory/coffee.factory.js";
import { createMockCoffeeRepository } from "../../../testing/factory/mock-coffee.factory.js";

describe("GetCoffeesService", () => {
	const mockCoffees = [defaultCoffeeList[0]];
	const mockRepo = createMockCoffeeRepository(mockCoffees);

	it("delegates to repo.findAll()", () => {
		const service = new GetCoffeesService(mockRepo);
		const result = service.execute();
		expect(result).toBe(mockCoffees);
		expect(mockRepo.findAll).toHaveBeenCalledOnce();
		expect(vi.isMockFunction(mockRepo.findByName)).toBe(true);
	});
});
