/**
 * Implementation of {@link McpService.stop}.
 *
 * @remarks
 * Closes every active SDK transport, clears the sessions map, and
 * logs completion. Yields the {@link SessionsRefTag} from the
 * Effect context rather than receiving the ref as an argument.
 *
 * @module
 */
import { Effect, Ref } from "effect";
import { SessionsRefTag } from "../shared/type/sessions-ref/sessions-ref.tag.js";

/**
 * Closes all active MCP sessions and clears the sessions map.
 */
export const stop = () =>
	Effect.gen(function* () {
		const sessionsRef = yield* SessionsRefTag;
		const sessions = yield* Ref.get(sessionsRef);
		for (const [, entry] of sessions) {
			yield* Effect.promise(() => entry.sdkTransport.close());
		}
		sessions.clear();
		yield* Effect.logInfo("All MCP sessions closed");
	});
