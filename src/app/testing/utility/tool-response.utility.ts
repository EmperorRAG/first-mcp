/**
 * Helpers for creating and parsing MCP ToolTextResponse objects in tests.
 *
 * @module
 */
import type { ToolTextResponse } from "../../type/tool-response/tool-response.js";

/**
 * Creates a ToolTextResponse wrapping the given text in the MCP content format.
 *
 * @param text - The text payload to wrap.
 * @returns A ToolTextResponse with a single text content block.
 */
export function createToolTextResponse(text: string): ToolTextResponse {
	return {
		content: [{ type: "text", text }],
	};
}

/**
 * Extracts and JSON-parses the first text content block from a ToolTextResponse.
 *
 * @param response - The ToolTextResponse to parse.
 * @returns The parsed JSON value.
 */
export function parseFirstToolTextAsJson(
	response: ToolTextResponse,
): unknown {
	return JSON.parse(response.content[0].text);
}