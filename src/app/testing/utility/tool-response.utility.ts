import type { ToolTextResponse } from "../../type/tool-response/tool-response.js";

export function createToolTextResponse(text: string): ToolTextResponse {
	return {
		content: [{ type: "text", text }],
	};
}

export function parseFirstToolTextAsJson(
	response: ToolTextResponse,
): unknown {
	return JSON.parse(response.content[0].text);
}