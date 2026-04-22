/**
 * Handles `"not-found"` route action.
 *
 * @module
 */
import type { Effect } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../../schema/response/mcp-response.js";
import { respond } from "../../respond/respond.js";

/**
 * Responds 404 with `{ error: "Not found" }`.
 */
export const handleNotFound = (
	request: McpRequest,
): Effect.Effect<void> =>
	respond(
		request,
		new McpResponse({
			status: 404,
			body: { error: "Not found" },
			headers: undefined,
		}),
	);
