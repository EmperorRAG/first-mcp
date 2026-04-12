/**
 * Unit tests for `GetACoffeeService.execute()` with a mocked repository.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { GetACoffeeService } from "./get-a-coffee.service.js";
import { flatWhiteCoffee } from "../../../testing/factory/coffee.factory.js";
import { createMockCoffeeRepository } from "../../../testing/factory/mock-coffee.factory.js";

describe("GetACoffeeService", () => {
	const mockRepo = createMockCoffeeRepository([flatWhiteCoffee]);

	it("returns a coffee when found", () => {
		const service = new GetACoffeeService(mockRepo);
		const result = service.execute("Flat White");
		expect(result).toEqual(flatWhiteCoffee);
		expect(mockRepo.findByName).toHaveBeenCalledWith("Flat White");
	});

	it("returns undefined when not found", () => {
		const service = new GetACoffeeService(mockRepo);
		const result = service.execute("nonexistent");
		expect(result).toBeUndefined();
	});
});
