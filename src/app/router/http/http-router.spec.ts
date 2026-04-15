/**
 * Unit tests for the HTTP router ({@link HttpRouterLive}).
 *
 * @remarks
 * Validates the resolution logic: DNS rebinding guard, CORS preflight,
 * health check, MCP paths, and not-found fallback.  Uses plain
 * {@link McpRequest} instances (no HTTP I/O needed).
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { HttpRouterLive } from "./http-router.js";
import { Router } from "../router.js";
import { McpRequest } from "../../transport/mcp-request.js";

/**
 * Helper — resolves a {@link McpRequest} through the HTTP router.
 */
const resolve = (overrides: Partial<ConstructorParameters<typeof McpRequest>[0]>) =>
	Effect.gen(function* () {
		const router = yield* Router;
		return yield* router.resolve(
			new McpRequest({
				method: "GET",
				path: "/",
				sessionId: undefined,
				body: undefined,
				isInitialize: false,
				host: "localhost:3001",
				raw: {},
				...overrides,
			}),
		);
	}).pipe(Effect.provide(HttpRouterLive), Effect.runPromise);

describe("HttpRouterLive", () => {
	it("returns forbidden for invalid host", async () => {
		expect(await resolve({ host: "evil.com" })).toBe("forbidden");
	});

	it("returns forbidden for undefined host", async () => {
		expect(await resolve({ host: undefined })).toBe("forbidden");
	});

	it("returns cors-preflight for OPTIONS", async () => {
		expect(await resolve({ method: "OPTIONS" })).toBe("cors-preflight");
	});

	it("returns health-check for GET /health", async () => {
		expect(await resolve({ method: "GET", path: "/health" })).toBe(
			"health-check",
		);
	});

	it("returns mcp-message for POST /mcp", async () => {
		expect(await resolve({ method: "POST", path: "/mcp" })).toBe(
			"mcp-message",
		);
	});

	it("returns mcp-sse for GET /mcp", async () => {
		expect(await resolve({ method: "GET", path: "/mcp" })).toBe("mcp-sse");
	});

	it("returns session-terminate for DELETE /mcp", async () => {
		expect(await resolve({ method: "DELETE", path: "/mcp" })).toBe(
			"session-terminate",
		);
	});

	it("returns not-found for unknown path", async () => {
		expect(await resolve({ method: "GET", path: "/unknown" })).toBe(
			"not-found",
		);
	});

	it("accepts 127.0.0.1 as valid host", async () => {
		expect(await resolve({ host: "127.0.0.1:3001", method: "GET", path: "/health" })).toBe(
			"health-check",
		);
	});

	it("returns forbidden for bare ::1 (simple split does not handle IPv6)", async () => {
		expect(await resolve({ host: "::1", method: "GET", path: "/health" })).toBe(
			"forbidden",
		);
	});
});
