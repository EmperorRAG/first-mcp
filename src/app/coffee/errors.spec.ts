/**
 * Unit tests for coffee domain tagged errors.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { CoffeeNotFoundError } from "./errors.js";

describe("CoffeeNotFoundError", () => {
	it("has _tag 'CoffeeNotFoundError'", () => {
		const error = new CoffeeNotFoundError({ coffeeName: "Mocha" });
		expect(error._tag).toBe("CoffeeNotFoundError");
	});

	it("carries the coffee name", () => {
		const error = new CoffeeNotFoundError({ coffeeName: "Mocha" });
		expect(error.coffeeName).toBe("Mocha");
	});

	it("is an instance of Error", () => {
		const error = new CoffeeNotFoundError({ coffeeName: "Mocha" });
		expect(error).toBeInstanceOf(Error);
	});
});
