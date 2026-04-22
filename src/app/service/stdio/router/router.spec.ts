/**
 * Unit tests for the stdio router ({@link StdioRouterLive}).
 *
 * @remarks
 * Validates that the stdio router always resolves to `"mcp-message"`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { StdioRouterLive } from "./router.js";
import { Router } from "../../../router/router.js";
import { McpRequest } from "../../../schema/request/mcp-request.js";

describe("StdioRouterLive", () => {
	it("always resolves to mcp-message", async () => {
		const action = await Effect.gen(function* () {
			const router = yield* Router;
			return yield* router.resolve(
				new McpRequest({
					method: "MESSAGE",
					path: "/",
					sessionId: undefined,
					body: { jsonrpc: "2.0", method: "tools/list", id: 1 },
					isInitialize: false,
					host: undefined,
					raw: {},
				}),
			);
		}).pipe(Effect.provide(StdioRouterLive), Effect.runPromise);

		expect(action).toBe("mcp-message");
	});
});
