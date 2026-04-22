/**
 * Unit tests for the {@link RegisterableTool} interface and related types.
 *
 * @remarks
 * Validates that the exported types are structurally sound by creating
 * conforming objects and checking their properties at runtime.  Since
 * these are interfaces and type aliases (not classes), the tests verify
 * that objects satisfying the contracts can be created and used without
 * TypeScript errors.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import type {
	RegisterableTool,
	ToolResponse,
	ActiveToolsRecord,
} from "./registerable-tool.js";

describe("RegisterableTool types", () => {
	/**
	 * Verifies that an object satisfying {@link RegisterableTool}
	 * without an `inputSchema` can be constructed and its properties
	 * read correctly.
	 */
	it("accepts a tool without inputSchema", () => {
		/**
		 * Test fixture conforming to {@link RegisterableTool} with no
		 * input schema (like `get-coffees`).
		 *
		 * @internal
		 */
		const tool: RegisterableTool = {
			metaData: { name: "test-tool", description: "A test tool" },
			executeFormatted: () =>
				Effect.succeed({ content: [{ type: "text" as const, text: "ok" }] }),
		};
		expect(tool.metaData.name).toBe("test-tool");
		expect(tool.metaData.description).toBe("A test tool");
		expect(tool.inputSchema).toBeUndefined();
	});

	/**
	 * Verifies that an object satisfying {@link RegisterableTool}
	 * with an `inputSchema` can be constructed and its properties
	 * read correctly.
	 */
	it("accepts a tool with inputSchema", () => {
		/**
		 * Test fixture conforming to {@link RegisterableTool} with an
		 * input schema (like `get-a-coffee`).
		 *
		 * @internal
		 */
		const tool: RegisterableTool = {
			metaData: { name: "test-tool", description: "A test tool" },
			inputSchema: { "~standard": { version: 1 } },
			executeFormatted: () =>
				Effect.succeed({ content: [{ type: "text" as const, text: "ok" }] }),
		};
		expect(tool.inputSchema).toBeDefined();
	});

	/**
	 * Verifies that {@link ActiveToolsRecord} values can be read as
	 * booleans.
	 */
	it("ActiveToolsRecord maps tool names to booleans", () => {
		/**
		 * Test fixture conforming to {@link ActiveToolsRecord}.
		 *
		 * @internal
		 */
		const record: ActiveToolsRecord = {
			"get-coffees": true,
			"get-a-coffee": false,
		};
		expect(record["get-coffees"]).toBe(true);
		expect(record["get-a-coffee"]).toBe(false);
	});

	/**
	 * Verifies that {@link ToolResponse} content array can hold
	 * multiple text entries.
	 */
	it("ToolResponse supports multiple content entries", () => {
		/**
		 * Test fixture conforming to {@link ToolResponse}.
		 *
		 * @internal
		 */
		const response: ToolResponse = {
			content: [
				{ type: "text", text: "first" },
				{ type: "text", text: "second" },
			],
		};
		expect(response.content).toHaveLength(2);
	});
});
