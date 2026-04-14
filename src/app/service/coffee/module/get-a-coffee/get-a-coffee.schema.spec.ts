/**
 * Unit tests for the {@link GetACoffeeInput} Effect Schema and its
 * {@link GetACoffeeInputStandard | StandardSchema} bridge.
 *
 * @remarks
 * Validates:
 *
 * - **JSON Schema shape** — the generated
 *   {@link GetACoffeeInputJsonSchema} has the expected `type` and
 *   `properties`.
 * - **StandardSchema validation** — valid input produces a `value`
 *   without `issues`; invalid input produces `issues`.
 * - **Type inference** — the inferred `GetACoffeeInput.Type` is
 *   structurally usable as a plain object with a `name` property.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import {
	GetACoffeeInput,
	GetACoffeeInputJsonSchema,
	GetACoffeeInputStandard,
} from "./get-a-coffee.schema.js";

describe("GetACoffeeInput schema", () => {
	it("JSON Schema has a name property of type string", () => {
		expect(GetACoffeeInputJsonSchema).toHaveProperty("type", "object");
		expect(GetACoffeeInputJsonSchema).toHaveProperty("properties.name");
	});

	it("StandardSchema validates valid input", () => {
		const result = GetACoffeeInputStandard["~standard"].validate({
			name: "Espresso",
		});
		expect(result).toHaveProperty("value", { name: "Espresso" });
		expect(result).not.toHaveProperty("issues");
	});

	it("StandardSchema rejects invalid input", () => {
		const result = GetACoffeeInputStandard["~standard"].validate({});
		expect(result).toHaveProperty("issues");
	});
});

describe("GetACoffeeInput type inference", () => {
	it("exports the inferred type", () => {
		const input: typeof GetACoffeeInput.Type = { name: "Latte" };
		expect(input.name).toBe("Latte");
	});
});
