import type { Coffee } from "../../coffee/shared/type/coffee.types.js";
import { getObjectProperty } from "./reflect.utility.js";

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

export function parseCoffeeJson(text: string): Coffee {
	const parsed: unknown = JSON.parse(text);
	if (!isCoffee(parsed)) {
		throw new Error("Expected tool output to conform to Coffee interface");
	}
	return parsed;
}

export function parseCoffeeArrayJson(text: string): Coffee[] {
	const parsed: unknown = JSON.parse(text);
	if (!Array.isArray(parsed) || !parsed.every(isCoffee)) {
		throw new Error("Expected tool output to conform to Coffee[] interface");
	}
	return parsed;
}