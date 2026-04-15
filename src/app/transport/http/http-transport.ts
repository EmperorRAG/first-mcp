/**
 * HTTP transport implementation — slim {@link Layer.succeed} adapter
 * that delegates all data transformation to the {@link McpRequest} and
 * {@link McpResponse} DTOs.
 *
 * @remarks
 * Provides the {@link HttpTransportLive} layer satisfying the shared
 * {@link Transport} tag for HTTP mode.  Each method is a thin
 * orchestration wrapper:
 *
 * | Method | Delegates to |
 * |--------|-------------|
 * | {@link TransportShape.parse | parse} | {@link McpRequest.decodeRawHttpRequest} |
 * | {@link TransportShape.respond | respond} | {@link McpResponse.encodeRawHttpResponse} |
 * | {@link TransportShape.handleMcp | handleMcp} | `NodeStreamableHTTPServerTransport.handleRequest` |
 *
 * All session management, HTTP server lifecycle, and routing logic
 * live in the {@link McpServerService} — this layer has no dependencies
 * and no state.
 *
 * @module
 */
import type { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Effect, Layer } from "effect";
import { Transport } from "../transport.js";
import type { HttpRawContext } from "../mcp-request.js";
import { McpRequest } from "../mcp-request.js";
import { McpResponse } from "../mcp-response.js";

/**
 * Wire-format input for an HTTP request before DTO transformation.
 *
 * @internal
 */
interface HttpRawInput {
	readonly req: IncomingMessage;
	readonly res: ServerResponse;
	readonly body: unknown;
}

/**
 * {@link Layer} providing the HTTP implementation of the shared
 * {@link Transport} tag.
 *
 * @remarks
 * Constructed via {@link Layer.succeed} — no dependencies, no scoped
 * resources.  The implementation relies entirely on DTO static methods
 * for data transformation and on the raw context stored in
 * {@link McpRequest.raw} for I/O.
 *
 * Provide this layer when {@link AppConfig.mode} is `"http"`.
 *
 * @example
 * ```ts
 * import { Layer } from "effect";
 * import { HttpTransportLive } from "./http-transport.js";
 *
 * const AppLive = Layer.mergeAll(AppConfig.Default, HttpTransportLive);
 * ```
 */
export const HttpTransportLive: Layer.Layer<Transport> = Layer.succeed(
	Transport,
	{
		parse: (raw) => {
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			const ctx = raw as HttpRawInput;
			return McpRequest.decodeRawHttpRequest(ctx);
		},

		respond: (request, response) =>
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
			}),

		handleMcp: (request, sdkTransport) =>
			Effect.promise(() => {
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				const ctx = request.raw as HttpRawContext;
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				const transport = sdkTransport as NodeStreamableHTTPServerTransport;
				return transport.handleRequest(ctx.req, ctx.res, request.body);
			}),
	},
);
