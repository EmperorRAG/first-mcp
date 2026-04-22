/**
 * Stdio listener — {@link Effect.Service} that creates a single MCP
 * session using {@link StdioServerTransport} for local VS Code
 * integration via `.vscode/mcp.json`.
 *
 * @remarks
 * Unlike the HTTP listener, stdio requires no routing, body parsing,
 * or multi-session management.  The SDK reads directly from `stdin`
 * and writes to `stdout` after the session is established.
 *
 * @module
 */
import { Effect, Layer } from "effect";
import { McpService } from "../mcp/mcp.service.js";
import { start } from "./start/start.js";
import { stop } from "./stop/stop.js";

/**
 * Effect service managing the single stdio MCP session. Composes the
 * per-method effects in `start/` and `stop/` by providing them with
 * the resolved {@link McpService}.
 */
export class StdioService extends Effect.Service<StdioService>()(
	"StdioService",
	{
		scoped: Effect.gen(function* () {
			const service = yield* McpService;

			const internalLayer = Layer.succeed(McpService, service);

			return {
				start: () => start().pipe(Effect.provide(internalLayer)),
				stop: () => stop().pipe(Effect.provide(internalLayer)),
			};
		}),
		dependencies: [McpService.Default],
	},
) { }