/**
 * Handles `"cors-preflight"` route action — OPTIONS request.
 *
 * @module
 */
import type { Effect } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse, CORS_HEADERS } from "../../../../schema/response/mcp-response.js";
import { respond } from "../../respond/respond.js";

/**
 * Responds 204 with the standard CORS headers.
 */
export const handleCorsPreflight = (
	request: McpRequest,
): Effect.Effect<void> =>
	respond(
		request,
		new McpResponse({
			status: 204,
			body: undefined,
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			headers: CORS_HEADERS as Record<string, string>,
		}),
	);
