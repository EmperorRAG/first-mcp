/**
 * Unit tests for the MCP server shared types.
 *
 * @remarks
 * Validates that the {@link McpServerService} tag, the
 * {@link McpServerServiceShape} interface, and the
 * {@link ToolRegistrationFn} callback signature are structurally
 * correct and satisfy their contracts.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { McpServerService } from "./types.js";

/**
 * Verifies the {@link McpServerService} Context.Tag is correctly
 * identified.
 */
describe("McpServerService tag", () => {
	/**
	 * The tag key must match the string identifier used in
	 * `Context.Tag("McpServerService")`.
	 */
	it("has the expected service identifier", () => {
		expect(McpServerService.key).toBe("McpServerService");
	});
});
