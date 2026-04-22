/**
 * Implementation of {@link McpServiceInterface.getSession}.
 *
 * @remarks
 * Looks up an MCP session by ID in the {@link SessionsRefTag}-provided
 * sessions map. Fails with {@link SessionNotFoundError} when the
 * session is absent.
 *
 * @module
 */
import { Effect, Ref } from "effect";
import { SessionsRefTag } from "../shared/type/sessions-ref/sessions-ref.tag.js";
import { SessionNotFoundError } from "../shared/error/session-not-found/session-not-found.js";

/**
 * Retrieves an MCP {@link SessionEntry} by its identifier.
 *
 * @param sessionId - The MCP session identifier to look up.
 */
export const getSession = (sessionId: string) =>
	Effect.gen(function* () {
		const sessionsRef = yield* SessionsRefTag;
		const sessions = yield* Ref.get(sessionsRef);
		const entry = sessions.get(sessionId);
		if (!entry) {
			return yield* new SessionNotFoundError({ sessionId });
		}
		return entry
	});
