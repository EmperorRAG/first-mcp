/**
 * Unit tests for `InMemoryCoffeeRepository.findAll()` and `findByName()`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { InMemoryCoffeeRepository } from "./coffee.repository.js";
import { flatWhiteCoffee } from "../../../../testing/factory/coffee.factory.js";

describe("InMemoryCoffeeRepository", () => {
	const repo = new InMemoryCoffeeRepository();

	describe("findAll", () => {
		it("returns all coffee items", () => {
			const result = repo.findAll();
			expect(result).toHaveLength(4);
		});

		it("returns items with expected shape", () => {
			const result = repo.findAll();
			for (const coffee of result) {
				expect(coffee).toHaveProperty("id");
				expect(coffee).toHaveProperty("name");
				expect(coffee).toHaveProperty("size");
				expect(coffee).toHaveProperty("price");
				expect(coffee).toHaveProperty("iced");
				expect(coffee).toHaveProperty("caffeineMg");
			}
		});
	});

	describe("findByName", () => {
		it("returns a matching coffee", () => {
			const result = repo.findByName(flatWhiteCoffee.name);
			expect(result).toBeDefined();
			expect(result!.name).toBe(flatWhiteCoffee.name);
			expect(result!.price).toBe(flatWhiteCoffee.price);
		});

		it("returns undefined for non-existent coffee", () => {
			const result = repo.findByName("nonexistent");
			expect(result).toBeUndefined();
		});
	});
});
