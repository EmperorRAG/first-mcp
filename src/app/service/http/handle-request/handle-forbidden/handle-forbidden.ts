/**
 * Handles `"forbidden"` route action — DNS rebinding rejection.
 *
 * @module
 */
import type { Effect } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../../schema/response/mcp-response.js";
import { respond } from "../../respond/respond.js";

/**
 * Responds 403 with `{ error: "DNS rebinding protection" }`.
 */
export const handleForbidden = (
	request: McpRequest,
): Effect.Effect<void> =>
	respond(
		request,
		new McpResponse({
			status: 403,
			body: { error: "DNS rebinding protection" },
			headers: undefined,
		}),
	);
