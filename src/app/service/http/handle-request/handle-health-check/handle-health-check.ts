/**
 * Handles `"health-check"` route action — GET /health.
 *
 * @module
 */
import type { Effect } from "effect";
import type { McpRequest } from "../../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../../schema/response/mcp-response.js";
import { respond } from "../../respond/respond.js";

/**
 * Responds 200 with `{ status: "ok" }`.
 */
export const handleHealthCheck = (
	request: McpRequest,
): Effect.Effect<void> =>
	respond(
		request,
		new McpResponse({
			status: 200,
			body: { status: "ok" },
			headers: undefined,
		}),
	);
