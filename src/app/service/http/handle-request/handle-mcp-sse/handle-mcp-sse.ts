/**
 * Handles `"mcp-sse"` route action — SSE backward-compat stream.
 * Requires an existing session ID.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../../schema/response/mcp-response.js";
import { McpService } from "../../../mcp/mcp.service.js";
import { SessionNotFoundError } from "../../../mcp/shared/error/session-not-found/session-not-found.js";
import { handleMcp } from "../../handle-mcp/handle-mcp.js";
import { respond } from "../../respond/respond.js";

/**
 * Streams an SSE response for an existing MCP session, or returns 400.
 */
export const handleMcpSse = (
	request: McpRequest,
): Effect.Effect<void, SessionNotFoundError, McpService> =>
	Effect.gen(function* () {
		const mcpSvc = yield* McpService;
		if (request.sessionId) {
			const session = yield* mcpSvc.getSession(request.sessionId);
			yield* handleMcp(request, session.sdkTransport);
			return;
		}
		yield* respond(
			request,
			new McpResponse({
				status: 400,
				body: { error: "Invalid or missing session" },
				headers: undefined,
			}),
		);
	});
