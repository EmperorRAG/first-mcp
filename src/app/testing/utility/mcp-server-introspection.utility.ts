import type { McpServer } from "@modelcontextprotocol/server";
import { getObjectProperty, getStringProperty, toResponseBody } from "./reflect.utility.js";

export function getRegisteredTools(server: McpServer): Record<string, unknown> {
	const tools: unknown = Reflect.get(server, "_registeredTools");
	if (typeof tools !== "object" || tools === null) {
		throw new Error("Server does not expose _registeredTools");
	}
	return toResponseBody(tools);
}

export function getRegisteredTool(
	tools: Record<string, unknown>,
	name: string,
): Record<string, unknown> | undefined {
	const tool = tools[name];
	if (typeof tool !== "object" || tool === null) {
		return undefined;
	}
	return toResponseBody(tool);
}

export function getRegisteredToolNames(server: McpServer): string[] {
	return Object.keys(getRegisteredTools(server));
}

export function getSchemaShape(schema: unknown): Record<string, unknown> | undefined {
	const definition = getObjectProperty(schema, "def");
	const shape = getObjectProperty(definition, "shape");
	if (typeof shape !== "object" || shape === null) {
		return undefined;
	}
	return toResponseBody(shape);
}

export function getServerInfoValue(
	server: McpServer,
	key: "name" | "version",
): string {
	const internalServer = Reflect.get(server, "server");
	const serverInfo = getObjectProperty(internalServer, "_serverInfo");
	const value = getStringProperty(serverInfo, key);
	if (!value) {
		throw new Error(`Server info field ${key} is unavailable`);
	}
	return value;
}