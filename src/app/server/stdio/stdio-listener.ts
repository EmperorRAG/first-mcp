/**
 * Stdio listener — {@link Context.Tag} and {@link Layer} that creates
 * a single MCP session using {@link StdioServerTransport} for local
 * VS Code integration via `.vscode/mcp.json`.
 *
 * @remarks
 * Unlike the HTTP listener, stdio requires no routing, body parsing,
 * or multi-session management.  The SDK reads directly from `stdin`
 * and writes to `stdout` after the session is established.
 *
 * @module
 */
import { Context, Effect, Layer } from "effect";
import { McpServerService } from "../mcp/mcp-server.js";

/**
 * Service contract for the stdio listener.
 *
 * @remarks
 * Provides {@link start} to create a single stdio MCP session, and
 * {@link stop} to tear it down.
 */
export interface StdioListenerShape {
	/** Creates a single MCP session over stdio. */
	readonly start: () => Effect.Effect<void>;
	/** Closes all MCP sessions (the single stdio session). */
	readonly stop: () => Effect.Effect<void>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link StdioListenerShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"StdioListener"`.
 */
export class StdioListener extends Context.Tag("StdioListener")<
	StdioListener,
	StdioListenerShape
>() { }

/**
 * Live {@link Layer} providing the {@link StdioListener} service.
 *
 * @remarks
 * Dependencies:
 *
 * - {@link McpServerService} — session CRUD
 *
 * Creates a single MCP session with the fixed ID `"stdio"` when
 * {@link StdioListenerShape.start | start()} is called.
 */
export const StdioListenerLive: Layer.Layer<StdioListener, never, McpServerService> =
	Layer.effect(
		StdioListener,
		Effect.gen(function* () {
			const mcpSvc = yield* McpServerService;

			return {
				start: () =>
					Effect.gen(function* () {
						yield* mcpSvc.setSession();
					}),

				stop: () => mcpSvc.stop(),
			} satisfies StdioListenerShape;
		}),
	);
