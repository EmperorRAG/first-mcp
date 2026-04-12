/**
 * Shared MCP tool response type used by all controllers.
 *
 * @module
 */
/**
 * Standard response shape returned by MCP tool controllers.
 *
 * @remarks
 * Wraps tool output in the text content format expected by the MCP protocol.
 * Controllers return this type; the MCP SDK forwards it to the client.
 */
export interface ToolTextResponse {
	[key: string]: unknown;
	/** Array of text content blocks returned to the MCP client. */
	content: { type: "text"; text: string }[];
}
