/**
 * Handles `"mcp-message"` route action. Either forwards to an existing
 * session's SDK transport, initializes a new session, or returns a 400.
 *
 * @module
 */
import { Effect, Either } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../../schema/response/mcp-response.js";
import { McpService } from "../../../mcp/mcp.service.js";
import { handleMcp } from "../../handle-mcp/handle-mcp.js";
import { respond } from "../../respond/respond.js";

/**
 * Dispatches an MCP-protocol POST: existing session, initialize, or
 * 400 invalid.
 */
export const handleMcpMessage = (
	request: McpRequest,
): Effect.Effect<void, never, McpService> =>
	Effect.gen(function* () {
		const mcpSvc = yield* McpService;

		if (request.sessionId) {
			const result = yield* Effect.either(
				mcpSvc.getSession(request.sessionId),
			);
			if (Either.isRight(result)) {
				yield* handleMcp(request, result.right.sdkTransport);
				return;
			}
		}

		if (request.isInitialize) {
			const session = yield* mcpSvc.setSession();
			yield* handleMcp(request, session.sdkTransport);
			return;
		}

		yield* respond(
			request,
			new McpResponse({
				status: 400,
				body: { error: "Invalid request" },
				headers: undefined,
			}),
		);
	});
