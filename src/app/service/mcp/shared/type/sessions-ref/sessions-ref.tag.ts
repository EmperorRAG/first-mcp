/**
 * Internal {@link Context.Tag} that exposes the live MCP sessions
 * map as an Effect-managed {@link Ref}.
 *
 * @remarks
 * The tag is provided by `mcp.ts` via an internal {@link Layer} so
 * that each split method file (`start`, `stop`, `getSession`,
 * `setSession`, `deleteSession`) can yield the sessions ref through
 * `Effect.gen` instead of receiving it as a closure argument.
 *
 * The tag is not exported outside the `service/mcp/` folder; it is
 * an implementation detail of the session manager.
 *
 * @module
 */
import { Context, type Ref } from "effect";
import type { SessionEntry } from "../../../types.js";

/**
 * Effect tag whose service value is the {@link Ref} holding the
 * `Map<string, SessionEntry>` of active MCP sessions.
 */
export class SessionsRefTag extends Context.Tag("McpSessionsRef")<
	SessionsRefTag,
	Ref.Ref<Map<string, SessionEntry>>
>() { }
