import { getObjectProperty, getStringProperty } from "./reflect.utility.js";

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

export function parseToolCallText(payload: unknown): string | undefined {
	const result = getObjectProperty(payload, "result");
	const content = getObjectProperty(result, "content");
	return getTextContent(content);
}

export function parseHealthStatus(payload: unknown): string {
	const status = getStringProperty(payload, "status");
	if (!status) {
		throw new Error("Invalid health payload");
	}
	return status;
}

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