/**
 * Shared interface and types for MCP tools that can be auto-registered
 * by the server orchestrator.
 *
 * @remarks
 * Defines the contract that domain services must satisfy in order for
 * the MCP server to discover and register their tools automatically.
 * Each tool-capable service exposes a {@link RegisterableTool} shape
 * with {@link RegisterableToolMetaData | metaData}, an optional
 * `inputSchema`, and an {@link RegisterableTool.executeFormatted}
 * handler.
 *
 * | Export | Purpose |
 * |--------|---------|
 * | {@link ToolResponse} | MCP-compatible response shape |
 * | {@link RegisterableToolMetaData} | Tool name + description |
 * | {@link RegisterableTool} | Full tool contract for auto-registration |
 * | {@link ActiveToolsRecord} | Tool-name → enabled lookup |
 *
 * @module
 */
import type { Effect } from "effect";

/**
 * MCP-compatible tool response shape returned by
 * {@link RegisterableTool.executeFormatted}.
 *
 * @remarks
 * Mirrors the `CallToolResult` content structure expected by the MCP
 * SDK.  Each element in the `content` array carries a `type`
 * discriminant (`"text"`) and the serialised payload.
 */
export interface ToolResponse {
	[key: string]: unknown;
	content: { type: "text"; text: string }[];
}

/**
 * Static metadata describing an MCP tool for registration.
 *
 * @remarks
 * The {@link name} is used as the unique tool identifier passed to
 * `McpServer.registerTool()` and as the lookup key in
 * {@link ActiveToolsRecord}.  The {@link description} is surfaced to
 * MCP clients.
 */
export interface RegisterableToolMetaData {
	readonly name: string;
	readonly description: string;
}

/**
 * Contract that a domain service must satisfy to be auto-registered
 * as an MCP tool by the server orchestrator.
 *
 * @remarks
 * Domain services (e.g. {@link GetCoffeesService},
 * {@link GetACoffeeService}) expose this shape so that
 * {@link registerCoffeeTools} can iterate them, check
 * {@link ActiveToolsRecord}, and call `McpServer.registerTool()`
 * without per-tool registration functions.
 *
 * - {@link metaData} — tool name and description.
 * - {@link inputSchema} — optional `StandardSchemaWithJSON` adapter
 *   for input validation (omitted when the tool has no arguments).
 * - {@link executeFormatted} — handler that receives the raw
 *   `unknown` args from the MCP SDK, decodes internally if needed,
 *   and returns a {@link ToolResponse}.
 */
export interface RegisterableTool {
	readonly metaData: RegisterableToolMetaData;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly inputSchema?: any;
	readonly executeFormatted: (args: unknown) => Effect.Effect<ToolResponse>;
}

/**
 * Lookup record mapping MCP tool names to their enabled state.
 *
 * @remarks
 * Sourced from the `ACTIVE_TOOLS` environment variable (via
 * {@link AppConfig}).  Only tools whose name appears as a key with
 * value `true` are registered on the {@link McpServer}.  Tools not
 * listed are inactive by default (opt-in model).
 *
 * @example
 * ```ts
 * const active: ActiveToolsRecord = {
 *   "get-coffees": true,
 *   "get-a-coffee": true,
 * };
 * ```
 */
export type ActiveToolsRecord = Record<string, boolean>;
