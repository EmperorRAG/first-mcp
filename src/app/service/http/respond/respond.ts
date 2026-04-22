/**
 * Encodes an {@link McpResponse} and writes it to the underlying HTTP
 * `ServerResponse` carried in {@link McpRequest.raw}.
 *
 * @module
 */
import { Effect } from "effect";
import type { McpRequest, HttpRawContext } from "../../../schema/request/mcp-request.js";
import { McpResponse } from "../../../schema/response/mcp-response.js";

/**
 * Writes a serialized {@link McpResponse} to the wire.
 */
export const respond = (
	request: McpRequest,
	response: McpResponse,
): Effect.Effect<void> =>
	Effect.sync(() => {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const ctx = request.raw as HttpRawContext;
		const data = McpResponse.encodeRawHttpResponse(response);
		ctx.res.writeHead(data.status, data.headers);
		if (data.body !== undefined) {
			ctx.res.end(data.body);
		} else {
			ctx.res.end();
		}
	});
