/**
 * Parsers for MCP protocol response payloads: `tools/list`,
 * `tools/call`, health, and SSE.
 *
 * @deprecated All exports in this module are deprecated.  The
 * Effect-TS migration moved response formatting into each service’s
 * `executeFormatted` method, and E2E tests now validate through the
 * MCP client transport rather than raw JSON-RPC parsing.  Will be
 * removed in a future cleanup pass.
 *
 * @remarks
 * Every function uses {@link getObjectProperty} and
 * {@link getStringProperty} from `reflect.utility.ts` for safe
 * property traversal on `unknown` payloads.
 *
 * | Export | Payload type |
 * |--------|--------------|
 * | {@link getTextContent} | MCP `content` array |
 * | {@link parseToolsListPayload} | `tools/list` JSON-RPC |
 * | {@link parseToolCallText} | `tools/call` JSON-RPC |
 * | {@link parseHealthStatus} | `/health` response |
 * | {@link parseSseResponse} | SSE `data:` frame |
 *
 * @module
 */
import { getObjectProperty, getStringProperty } from "./reflect.utility.js";

/**
 * Extracts the first `"text"` value from an MCP `content` array.
 *
 * @deprecated No longer imported by any test.  Response text is now
 * validated directly via the MCP client transport or service-level
 * assertions.
 *
 * @remarks
 * Iterates the array looking for an item whose `type` property
 * equals `"text"`, then returns its `text` property.  Returns
 * `undefined` if no text content is found or `content` is not an
 * array.
 *
 * @param content - The MCP response `content` array.
 * @returns The first text string, or `undefined` if absent.
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
 * @deprecated No longer imported by any test.  Use
 * `StreamableHTTPClientTransport` with a `tools/list` request
 * instead.
 *
 * @remarks
 * Navigates `payload.result.tools` via {@link getObjectProperty}.
 * Throws when the structure is invalid so tests fail explicitly.
 *
 * @param payload - The raw JSON-RPC response payload.
 * @returns An array of registered tool name strings.
 * @throws If `payload.result.tools` is not an array.
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
 * @deprecated No longer imported by any test.  Service-level
 * `executeFormatted` assertions replaced raw JSON-RPC inspection.
 *
 * @remarks
 * Navigates `payload.result.content` and delegates to
 * {@link getTextContent} for the final text extraction.
 *
 * @param payload - The raw JSON-RPC response payload.
 * @returns The first text string, or `undefined` if absent.
 */
export function parseToolCallText(payload: unknown): string | undefined {
	const result = getObjectProperty(payload, "result");
	const content = getObjectProperty(result, "content");
	return getTextContent(content);
}

/**
 * Extracts the `status` string from a health endpoint response.
 *
 * @deprecated No longer imported by any test.  Health assertions
 * now use direct `fetch` against `GET /health` in E2E tests.
 *
 * @remarks
 * Reads `payload.status` via {@link getStringProperty} and throws
 * when the field is missing, ensuring tests fail explicitly.
 *
 * @param payload - The parsed health response body.
 * @returns The status string (e.g., `"ok"`).
 * @throws If the payload does not contain a valid `status` field.
 */
export function parseHealthStatus(payload: unknown): string {
	const status = getStringProperty(payload, "status");
	if (!status) {
		throw new Error("Invalid health payload");
	}
	return status;
}

/**
 * Parses an SSE response by extracting the first `data:` line and
 * JSON-parsing it.
 *
 * @deprecated No longer imported by any test.  The Streamable HTTP
 * transport replaced SSE; use `StreamableHTTPClientTransport`
 * for E2E transport tests.
 *
 * @remarks
 * Reads the full response body as text, splits on newlines, and
 * finds the first line beginning with `"data: "`.  Falls back to
 * parsing the entire body if no `data:` prefix is found.
 *
 * @param response - The raw {@link Response} from an SSE endpoint.
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