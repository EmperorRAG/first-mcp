/**
 * Reflection-based introspection of {@link McpServer} internals for
 * test assertions.
 *
 * @deprecated All exports in this module are deprecated.  The
 * Effect-TS migration replaced the Zod-based tool schemas with
 * Effect Schema + {@link toStandardSchema}, making the
 * `_registeredTools` reflection path unreliable.  Prefer testing
 * tool behavior through the MCP protocol (e.g., `tools/list` via
 * {@link StreamableHTTPClientTransport}) instead of reflecting on
 * server internals.
 *
 * @remarks
 * Every function accesses private {@link McpServer} fields
 * (`_registeredTools`, `server._serverInfo`) via {@link Reflect.get}.
 * Because these fields are implementation details of the SDK, they
 * may break on any SDK upgrade.
 *
 * | Export | Purpose |
 * |--------|---------|
 * | {@link getRegisteredTools} | Full tools map |
 * | {@link getRegisteredTool} | Single tool lookup |
 * | {@link getRegisteredToolNames} | Tool name list |
 * | {@link getSchemaShape} | Zod schema shape |
 * | {@link getServerInfoValue} | Server name / version |
 *
 * @module
 */
import type { McpServer } from "@modelcontextprotocol/server";
import { getObjectProperty, getStringProperty, toResponseBody } from "./reflect.utility.js";

/**
 * Retrieves the internal `_registeredTools` map from an
 * {@link McpServer} via {@link Reflect.get}.
 *
 * @deprecated No longer imported by any test.  The Effect-TS
 * migration removed Zod-based tool registration; use `tools/list`
 * via the MCP protocol instead.
 *
 * @remarks
 * Throws if the private `_registeredTools` property is missing or
 * not an object—this guards against silent SDK changes.
 *
 * @param server - The {@link McpServer} instance to introspect.
 * @returns A plain record mapping tool names to their configuration
 *   objects.
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
 * Looks up a single registered tool by name from a tools record
 * obtained via {@link getRegisteredTools}.
 *
 * @deprecated No longer imported by any test.  Use `tools/list`
 * via the MCP protocol instead.
 *
 * @remarks
 * Returns `undefined` when the name is not present or the entry is
 * not a non-null object, so callers can assert existence without
 * catching.
 *
 * @param tools - The tools record from {@link getRegisteredTools}.
 * @param name - The tool name to look up.
 * @returns The tool configuration record, or `undefined` if not
 *   found.
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
 * Returns the names of all registered tools on an {@link McpServer}.
 *
 * @deprecated No longer imported by any test.  Use `tools/list`
 * via the MCP protocol instead.
 *
 * @remarks
 * Convenience wrapper that calls {@link getRegisteredTools} and
 * returns `Object.keys` of the resulting record.
 *
 * @param server - The {@link McpServer} instance to introspect.
 * @returns An array of tool name strings.
 */
export function getRegisteredToolNames(server: McpServer): string[] {
	return Object.keys(getRegisteredTools(server));
}

/**
 * Extracts the Zod schema `shape` from a tool's `inputSchema`
 * definition.
 *
 * @deprecated No longer imported by any test.  The Effect-TS
 * migration replaced Zod schemas with Effect Schema;
 * this accessor’s `def.shape` traversal no longer applies.
 *
 * @remarks
 * Navigates `schema.def.shape` via {@link getObjectProperty}.
 * Returns `undefined` when the traversal encounters a missing or
 * non-object node.
 *
 * @param schema - The raw schema object from a registered tool.
 * @returns The shape record, or `undefined` if the schema structure
 *   is unexpected.
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
 * Reads a server info field (`name` or `version`) from the internal
 * MCP server state via reflection.
 *
 * @deprecated No longer imported by any test.  Use `initialize`
 * response `serverInfo` via the MCP protocol instead.
 *
 * @remarks
 * Traverses `server.server._serverInfo[key]` using
 * {@link Reflect.get} and {@link getStringProperty}.  Throws when
 * the field is unavailable so tests fail loudly rather than
 * silently passing with `undefined`.
 *
 * @param server - The {@link McpServer} instance to introspect.
 * @param key - The server info field to read (`"name"` or
 *   `"version"`).
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