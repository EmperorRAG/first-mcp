/**
 * Implementation of {@link McpServiceInterface.deleteSession}.
 *
 * @remarks
 * Closes the SDK transport for the named session and removes it
 * from the sessions map. A missing session ID is treated as a
 * no-op so that callers can invoke this idempotently.
 *
 * @module
 */
import { Effect, Ref } from "effect";
import { SessionsRefTag } from "../shared/type/sessions-ref/sessions-ref.tag.js";

/**
 * Closes and removes an MCP session by its identifier.
 *
 * @param sessionId - The MCP session identifier to remove.
 */
export const deleteSession = (sessionId: string) =>
	Effect.gen(function* () {
		const sessionsRef = yield* SessionsRefTag;
		const sessions = yield* Ref.get(sessionsRef);
		const entry = sessions.get(sessionId);
		if (entry) {
			yield* Effect.promise(() => entry.sdkTransport.close());
			sessions.delete(sessionId);
		}
	});
