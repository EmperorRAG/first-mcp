/**
 * Reflection-based introspection of McpServer internals for test assertions.
 *
 * @module
 */
import type { McpServer } from "@modelcontextprotocol/server";
import { getObjectProperty, getStringProperty, toResponseBody } from "./reflect.utility.js";

/**
 * Retrieves the internal registered tools map from an McpServer via reflection.
 *
 * @param server - The McpServer instance to introspect.
 * @returns A record of tool name to tool configuration.
 * @throws If the server does not expose `_registeredTools`.
 */
export function getRegisteredTools(server: McpServer): Record<string, unknown> {
	const tools: unknown = Reflect.get(server, "_registeredTools");
	if (typeof tools !== "object" || tools === null) {
		throw new Error("Server does not expose _registeredTools");
	}
	return toResponseBody(tools);
}

/**
 * Looks up a single registered tool by name from a tools record.
 *
 * @param tools - The tools record obtained from {@link getRegisteredTools}.
 * @param name - The tool name to look up.
 * @returns The tool configuration record, or `undefined` if not found.
 */
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

/**
 * Returns the names of all registered tools on an McpServer.
 *
 * @param server - The McpServer instance to introspect.
 * @returns An array of tool name strings.
 */
export function getRegisteredToolNames(server: McpServer): string[] {
	return Object.keys(getRegisteredTools(server));
}

/**
 * Extracts the Zod schema shape from a tool's input schema definition.
 *
 * @param schema - The raw schema object from a registered tool.
 * @returns The shape record, or `undefined` if the schema structure is unexpected.
 */
export function getSchemaShape(schema: unknown): Record<string, unknown> | undefined {
	const definition = getObjectProperty(schema, "def");
	const shape = getObjectProperty(definition, "shape");
	if (typeof shape !== "object" || shape === null) {
		return undefined;
	}
	return toResponseBody(shape);
}

/**
 * Reads a server info field (`name` or `version`) from the internal MCP server state.
 *
 * @param server - The McpServer instance to introspect.
 * @param key - The server info field to read.
 * @returns The field value as a string.
 * @throws If the field is unavailable.
 */
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