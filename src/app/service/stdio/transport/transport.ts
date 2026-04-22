/**
 * Stdio transport implementation — slim {@link Layer.succeed} adapter
 * for local VS Code MCP integration.
 *
 * @remarks
 * Provides the {@link StdioTransportLive} layer satisfying the shared
 * {@link Transport} tag for stdio mode.  Because the SDK's
 * {@link StdioServerTransport} auto-handles `stdin`/`stdout` after
 * `server.connect()`, the transport methods are intentionally minimal:
 *
 * | Method | Behavior |
 * |--------|---------|
 * | {@link TransportShape.parse | parse} | Decodes via {@link McpRequest.decodeRawStdioMessage} |
 * | {@link TransportShape.respond | respond} | No-op — responses flow through the SDK |
 * | {@link TransportShape.handleMcp | handleMcp} | No-op — SDK reads `stdin` directly |
 *
 * All server lifecycle and SDK transport management live in the
 * {@link McpServerService} — this layer has no dependencies and no
 * state.
 *
 * @module
 */
import { Effect, Layer } from "effect";
import { Transport } from "../../../transport/transport.js";
import { McpRequest } from "../../../schema/request/mcp-request.js";

/**
 * {@link Layer} providing the stdio implementation of the shared
 * {@link Transport} tag.
 *
 * @remarks
 * Constructed via {@link Layer.succeed} — no dependencies, no scoped
 * resources.  The `respond` and `handleMcp` methods are no-ops because
 * stdio's bidirectional message flow is handled entirely by the SDK's
 * {@link StdioServerTransport} after `server.connect()`.
 *
 * Provide this layer when {@link AppConfig.mode} is `"stdio"` (or when
 * the `--stdio` CLI flag is present).
 *
 * @example
 * ```ts
 * import { Layer } from "effect";
 * import { StdioTransportLive } from "./stdio.js";
 *
 * const AppLive = Layer.mergeAll(AppConfig.Default, StdioTransportLive);
 * ```
 */
export const StdioTransportLive: Layer.Layer<Transport> = Layer.succeed(
	Transport,
	{
		parse: (raw) => {
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			const msg = raw as { readonly body: unknown };
			return McpRequest.decodeRawStdioMessage(msg);
		},

		respond: () => Effect.void,

		handleMcp: () => Effect.void,
	},
);
