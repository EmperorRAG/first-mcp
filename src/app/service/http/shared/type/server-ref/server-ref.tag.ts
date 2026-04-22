/**
 * Internal {@link Context.Tag} that exposes the bound HTTP server
 * (or `null` before {@link HttpService.start} resolves) so that the
 * per-method effects in `start/`, `stop/`, `port/`, and `address/`
 * can share the same handle without passing it explicitly.
 *
 * @module
 */
import { Context, type Ref } from "effect";
import type { Server } from "node:http";

/**
 * Effect tag whose service value is a {@link Ref} holding the bound
 * `node:http` {@link Server}, or `null` until {@link HttpService.start}
 * has resolved.
 */
export class ServerRefTag extends Context.Tag("HttpServerRef")<
	ServerRefTag,
	Ref.Ref<Server | null>
>() { }
