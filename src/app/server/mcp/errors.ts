/**
 * Tagged error types for the MCP server session manager.
 *
 * @remarks
 * Each error extends {@link Data.TaggedError}, enabling exhaustive
 * pattern matching via {@link Effect.catchTag} in listener and
 * transport layers without resorting to `instanceof` checks.
 *
 * @module
 */
import { Data } from "effect";

/**
 * Error raised when a requested MCP session cannot be found by ID.
 *
 * @remarks
 * Extends {@link Data.TaggedError} with the discriminant
 * `_tag = "SessionNotFoundError"`.  The `sessionId` field carries
 * the lookup key that failed, enabling callers to include it in
 * error responses or logging.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { SessionNotFoundError } from "./errors.js";
 *
 * const program = Effect.fail(
 *   new SessionNotFoundError({ sessionId: "abc-123" }),
 * ).pipe(
 *   Effect.catchTag("SessionNotFoundError", (e) =>
 *     Effect.succeed(`Not found: ${e.sessionId}`),
 *   ),
 * );
 * ```
 */
export class SessionNotFoundError extends Data.TaggedError(
	"SessionNotFoundError",
)<{ readonly sessionId: string }> { }
