/**
 * Generic reflection helpers for safe property access, type guards,
 * and HTTP header extraction.
 *
 * @remarks
 * Provides low-level building blocks consumed by higher-level test
 * utilities such as {@link getRegisteredTools} in
 * `mcp-server-introspection.utility.ts` and
 * {@link parseToolsListPayload} in `mcp-response.utility.ts`.
 * Every function performs defensive `typeof` / `null` checks so
 * callers never need to narrow `unknown` manually.
 *
 * | Export | Purpose |
 * |--------|---------|
 * | {@link getObjectProperty} | Reflect-based property read |
 * | {@link getStringProperty} | String-narrowing property read |
 * | {@link getSessionId} | *(deprecated)* MCP session header |
 * | {@link toResponseBody} | Object → plain record |
 * | {@link isFunctionValue} | `typeof` function guard |
 *
 * @module
 */
import type { IncomingHttpHeaders } from "node:http";

/**
 * Safely reads a property from an `unknown` value using
 * {@link Reflect.get}.
 *
 * @remarks
 * Returns `undefined` when `value` is not a non-null object, avoiding
 * the need for manual `typeof` / `null` guards at each call site.
 * Used extensively by {@link getStringProperty},
 * {@link getRegisteredTools}, {@link getSchemaShape}, and the
 * MCP response parsers.
 *
 * @param value - The value to read from (may be any type).
 * @param key - The property key to access on the object.
 * @returns The property value, or `undefined` if `value` is not a
 *   non-null object.
 */
export function getObjectProperty(value: unknown, key: string): unknown {
	if (typeof value !== "object" || value === null) {
		return undefined;
	}
	return Reflect.get(value, key);
}

/**
 * Reads a string property from an `unknown` value using reflection.
 *
 * @remarks
 * Delegates to {@link getObjectProperty} for the initial read, then
 * narrows the result to `string`.  Returns `undefined` when the
 * underlying value is missing or not a string.
 *
 * @param value - The value to read from (may be any type).
 * @param key - The property key to access on the object.
 * @returns The string value, or `undefined` if the property is absent
 *   or not a string.
 */
export function getStringProperty(value: unknown, key: string): string | undefined {
	const prop = getObjectProperty(value, key);
	if (typeof prop === "string") {
		return prop;
	}
	return undefined;
}

/**
 * Extracts the `Mcp-Session-Id` header from incoming HTTP headers.
 *
 * @deprecated Superseded by the non-exported `getSessionId` helper
 * in `http-transport.ts`, which operates on the full
 * {@link IncomingMessage} instead of raw headers.  Will be removed
 * in a future cleanup pass.
 *
 * @remarks
 * Handles both single-value and array-value header forms.  When the
 * header is an array (multiple values), returns the first element.
 *
 * @param headers - The {@link IncomingHttpHeaders} from the request.
 * @returns The session ID string, or `undefined` if the header is
 *   absent.
 */
export function getSessionId(headers: IncomingHttpHeaders): string | undefined {
	const value = headers["mcp-session-id"];
	if (Array.isArray(value)) {
		return value[0];
	}
	return value;
}

/**
 * Converts an `unknown` value to a plain `Record<string, unknown>`
 * via `Object.entries`.
 *
 * @remarks
 * Strips prototype-inherited properties by round-tripping through
 * {@link Object.entries} and {@link Object.fromEntries}.  Returns an
 * empty record for primitives, `null`, and arrays, preventing
 * downstream code from operating on unexpected shapes.
 *
 * @param value - The value to convert.
 * @returns A plain key-value record, or `{}` if `value` is not a
 *   non-null, non-array object.
 */
export function toResponseBody(value: unknown): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(Object.entries(value));
}

/**
 * Type guard that narrows an `unknown` value to a function signature.
 *
 * @remarks
 * Uses a `typeof` check and returns a type predicate so callers can
 * safely invoke the value without additional casting.  Currently
 * consumed by the stdio transport spec to verify that
 * {@link startStdioServer} is a callable export.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is a function; the compiler narrows the
 *   type accordingly.
 */
export function isFunctionValue(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}