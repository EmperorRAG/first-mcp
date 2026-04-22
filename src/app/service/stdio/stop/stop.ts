/**
 * Implementation of {@link StdioService.stop}.
 *
 * @remarks
 * Tears down the singleton stdio MCP session by delegating to
 * {@link McpService.stop}. Yields {@link McpService} from the
 * Effect context.
 *
 * @module
 */
import { Effect } from "effect";
import { McpService } from "../../mcp/mcp.service.js";

/**
 * Closes the single stdio MCP session.
 */
export const stop = () =>
	Effect.gen(function* () {
		const mcpSvc = yield* McpService;
		yield* mcpSvc.stop();
	});
