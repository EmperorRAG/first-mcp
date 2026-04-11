import type { IncomingHttpHeaders } from "node:http";

export function getObjectProperty(value: unknown, key: string): unknown {
	if (typeof value !== "object" || value === null) {
		return undefined;
	}
	return Reflect.get(value, key);
}

export function getStringProperty(value: unknown, key: string): string | undefined {
	const prop = getObjectProperty(value, key);
	if (typeof prop === "string") {
		return prop;
	}
	return undefined;
}

export function getSessionId(headers: IncomingHttpHeaders): string | undefined {
	const value = headers["mcp-session-id"];
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

export function toResponseBody(value: unknown): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(Object.entries(value));
}

export function isFunctionValue(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}