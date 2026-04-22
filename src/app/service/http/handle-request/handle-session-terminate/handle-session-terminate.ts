/**
 * Handles `"session-terminate"` route action — DELETE /mcp.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../../schema/response/mcp-response.js";
import { McpService } from "../../../mcp/mcp.service.js";
import { SessionNotFoundError } from "../../../mcp/shared/error/session-not-found/session-not-found.js";
import { respond } from "../../respond/respond.js";

/**
 * Closes an existing MCP session (DELETE /mcp), or returns 400.
 */
export const handleSessionTerminate = (
	request: McpRequest,
): Effect.Effect<void, SessionNotFoundError, McpService> =>
	Effect.gen(function* () {
		const mcpSvc = yield* McpService;
		if (request.sessionId) {
			yield* mcpSvc.getSession(request.sessionId);
			yield* mcpSvc.deleteSession(request.sessionId);
			yield* respond(
				request,
				new McpResponse({
					status: 200,
					body: undefined,
					headers: undefined,
				}),
			);
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
