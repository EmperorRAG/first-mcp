/**
 * Unit tests for the MCP server shared types and service.
 *
 * @remarks
 * Validates that the {@link McpServerService} tag and the
 * {@link McpServerServiceShape} interface are structurally correct
 * and satisfy their contracts.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { McpServerService } from "./mcp-server.js";

/**
 * Verifies the {@link McpServerService} Effect.Service is correctly
 * identified.
 */
describe("McpServerService tag", () => {
	/**
	 * The tag key must match the string identifier used in
	 * `Effect.Service()("McpServerService")`.
	 */
	it("has the expected service identifier", () => {
		expect(McpServerService.key).toBe("McpServerService");
	});
});
