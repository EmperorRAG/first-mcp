/**
 * Delegates an MCP protocol message to the SDK transport.
 *
 * @module
 */
import { Effect } from "effect";
import type { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import type { StdioServerTransport } from "@modelcontextprotocol/server";
import type { McpRequest, HttpRawContext } from "../../../schema/request/mcp-request.js";

/**
 * Forwards a parsed {@link McpRequest} to the SDK transport for
 * MCP protocol handling.
 */
export const handleMcp = (
	request: McpRequest,
	sdkTransport: NodeStreamableHTTPServerTransport | StdioServerTransport,
): Effect.Effect<void> =>
	Effect.promise(() => {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const ctx = request.raw as HttpRawContext;
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const transport = sdkTransport as NodeStreamableHTTPServerTransport;
		return transport.handleRequest(ctx.req, ctx.res, request.body);
	});
