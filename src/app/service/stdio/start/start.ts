/**
 * Implementation of {@link StdioService.start}.
 *
 * @remarks
 * Creates the singleton MCP session over stdio by delegating to
 * {@link McpService.setSession}. Yields {@link McpService} from the
 * Effect context.
 *
 * @module
 */
import { Effect } from "effect";
import { McpService } from "../../mcp/mcp.service.js";

/**
 * Creates the single stdio MCP session.
 */
export const start = () =>
	Effect.gen(function* () {
		const mcpSvc = yield* McpService;
		yield* mcpSvc.setSession();
	});
