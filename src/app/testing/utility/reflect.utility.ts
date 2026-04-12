/**
 * Generic reflection helpers for safe property access, type guards, and HTTP header extraction.
 *
 * @module
 */
import type { IncomingHttpHeaders } from "node:http";

/**
 * Safely reads a property from an unknown value using reflection.
 *
 * @param value - The value to read from.
 * @param key - The property key to access.
 * @returns The property value, or `undefined` if the value is not an object.
 */
export function getObjectProperty(value: unknown, key: string): unknown {
	if (typeof value !== "object" || value === null) {
		return undefined;
	}
	return Reflect.get(value, key);
}

/**
 * Reads a string property from an unknown value using reflection.
 *
 * @param value - The value to read from.
 * @param key - The property key to access.
 * @returns The string value, or `undefined` if not a string or value is not an object.
 */
export function getStringProperty(value: unknown, key: string): string | undefined {
	const prop = getObjectProperty(value, key);
	if (typeof prop === "string") {
		return prop;
	}
	return undefined;
}

/**
 * Extracts the `Mcp-Session-Id` header from an HTTP request.
 *
 * @param headers - The incoming HTTP headers.
 * @returns The session ID string, or `undefined` if the header is absent.
 */
export function getSessionId(headers: IncomingHttpHeaders): string | undefined {
	const value = headers["mcp-session-id"];
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

/**
 * Converts an unknown value to a plain key-value record via `Object.entries`.
 *
 * @param value - The value to convert.
 * @returns A plain object record, or an empty record if the value is not an object.
 */
export function toResponseBody(value: unknown): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(Object.entries(value));
}

/**
 * Type guard that checks whether an unknown value is a function.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a function.
 */
export function isFunctionValue(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}