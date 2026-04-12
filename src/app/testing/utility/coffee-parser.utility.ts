/**
 * JSON parsing and type-guard utilities for Coffee entities in test assertions.
 *
 * @module
 */
import type { Coffee } from "../../coffee/shared/type/coffee.types.js";
import { getObjectProperty } from "./reflect.utility.js";

/**
 * Type guard that validates whether an unknown value conforms to the Coffee interface.
 *
 * @param value - The value to validate.
 * @returns `true` if the value has all required Coffee properties with correct types.
 */
export function isCoffee(value: unknown): value is Coffee {
	return (
		typeof getObjectProperty(value, "id") === "number"
		&& typeof getObjectProperty(value, "name") === "string"
		&& typeof getObjectProperty(value, "size") === "string"
		&& typeof getObjectProperty(value, "price") === "number"
		&& typeof getObjectProperty(value, "iced") === "boolean"
		&& typeof getObjectProperty(value, "caffeineMg") === "number"
	);
}

/**
 * Parses a JSON string and validates it as a single Coffee entity.
 *
 * @param text - JSON string representing a Coffee object.
 * @returns The parsed Coffee entity.
 * @throws If the parsed value does not conform to the Coffee interface.
 */
export function parseCoffeeJson(text: string): Coffee {
	const parsed: unknown = JSON.parse(text);
	if (!isCoffee(parsed)) {
		throw new Error("Expected tool output to conform to Coffee interface");
	}
	return parsed;
}

/**
 * Parses a JSON string and validates it as an array of Coffee entities.
 *
 * @param text - JSON string representing a Coffee array.
 * @returns The parsed Coffee array.
 * @throws If any element does not conform to the Coffee interface.
 */
export function parseCoffeeArrayJson(text: string): Coffee[] {
	const parsed: unknown = JSON.parse(text);
	if (!Array.isArray(parsed) || !parsed.every(isCoffee)) {
		throw new Error("Expected tool output to conform to Coffee[] interface");
	}
	return parsed;
}