/**
 * Parsers for MCP protocol response payloads: tools/list, tools/call, health, and SSE.
 *
 * @module
 */
import { getObjectProperty, getStringProperty } from "./reflect.utility.js";

/**
 * Extracts the first text value from an MCP content array.
 *
 * @param content - The MCP response content array.
 * @returns The text string, or `undefined` if no text content is found.
 */
export function getTextContent(content: unknown): string | undefined {
	if (!Array.isArray(content)) {
		return undefined;
	}

	for (const item of content) {
		if (getObjectProperty(item, "type") === "text") {
			const text = getObjectProperty(item, "text");
			if (typeof text === "string") {
				return text;
			}
		}
	}

	return undefined;
}

/**
 * Parses a `tools/list` JSON-RPC response and returns the tool names.
 *
 * @param payload - The raw JSON-RPC response payload.
 * @returns An array of registered tool names.
 * @throws If the payload structure is invalid.
 */
export function parseToolsListPayload(payload: unknown): string[] {
	const result = getObjectProperty(payload, "result");
	const tools = getObjectProperty(result, "tools");
	if (!Array.isArray(tools)) {
		throw new Error("Invalid tools/list payload");
	}

	const names: string[] = [];
	for (const tool of tools) {
		const name = getStringProperty(tool, "name");
		if (name) {
			names.push(name);
		}
	}

	return names;
}

/**
 * Extracts the text content from a `tools/call` JSON-RPC response.
 *
 * @param payload - The raw JSON-RPC response payload.
 * @returns The text string, or `undefined` if absent.
 */
export function parseToolCallText(payload: unknown): string | undefined {
	const result = getObjectProperty(payload, "result");
	const content = getObjectProperty(result, "content");
	return getTextContent(content);
}

/**
 * Extracts the status string from a health endpoint response.
 *
 * @param payload - The parsed health response body.
 * @returns The status string.
 * @throws If the payload does not contain a valid status field.
 */
export function parseHealthStatus(payload: unknown): string {
	const status = getStringProperty(payload, "status");
	if (!status) {
		throw new Error("Invalid health payload");
	}
	return status;
}

/**
 * Parses an SSE response by extracting the first `data:` line and JSON-parsing it.
 *
 * @param response - The raw fetch Response from an SSE endpoint.
 * @returns A promise resolving to the parsed JSON payload.
 */
export async function parseSseResponse(response: Response): Promise<unknown> {
	const text = await response.text();
	const lines = text.split("\n");
	for (const line of lines) {
		if (line.startsWith("data: ")) {
			return JSON.parse(line.slice(6));
		}
	}
	return JSON.parse(text);
}