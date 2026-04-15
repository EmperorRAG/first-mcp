/**
 * Stdio router implementation — always resolves to `"mcp-message"`.
 *
 * @remarks
 * Provides the {@link StdioRouterLive} layer satisfying the shared
 * {@link Router} tag for stdio mode.  Because all stdio input is an
 * MCP JSON-RPC message, there is no need for path or method
 * discrimination — every request maps to `"mcp-message"`.
 *
 * @module
 */
import { Effect, Layer } from "effect";
import { Router } from "../router.js";

/**
 * {@link Layer} providing the stdio implementation of the shared
 * {@link Router} tag.
 *
 * @remarks
 * Constructed via {@link Layer.succeed} — no dependencies, no state.
 * The resolution always returns `"mcp-message"` because stdio
 * carries only MCP protocol traffic.
 *
 * Provide this layer when {@link AppConfig.mode} is `"stdio"` (or when
 * the `--stdio` CLI flag is present).
 *
 * @example
 * ```ts
 * import { Layer } from "effect";
 * import { StdioRouterLive } from "./stdio-router.js";
 *
 * const AppLive = Layer.mergeAll(StdioRouterLive, StdioTransportLive);
 * ```
 */
export const StdioRouterLive: Layer.Layer<Router> = Layer.succeed(
	Router,
	{
		resolve: () => Effect.succeed("mcp-message" as const),
	},
);
