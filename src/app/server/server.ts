/**
 * Shared listener abstraction — {@link Context.Tag} and
 * {@link ListenerShape} interface for dependency-injected server
 * selection.
 *
 * @remarks
 * Defines a polymorphic {@link Listener} tag that both
 * {@link HttpListenerLive} and {@link StdioListenerLive} satisfy.
 * Consumer code (e.g. `main.ts`) resolves the {@link Listener} tag
 * and calls {@link ListenerShape.start | start()} / {@link
 * ListenerShape.stop | stop()} without knowing which concrete
 * listener is in use.
 *
 * @module
 */
import { Context, type Effect } from "effect";

/**
 * Service contract for an MCP server listener.
 *
 * @remarks
 * Every listener implementation provides two lifecycle methods:
 *
 * | Method | Responsibility |
 * |--------|---------------|
 * | {@link start} | Binds the server and begins accepting connections |
 * | {@link stop} | Closes the server and tears down all sessions |
 */
export interface ListenerShape {
	/** Starts the listener (binds TCP or creates stdio session). */
	readonly start: () => Effect.Effect<void>;
	/** Stops the listener and all active sessions. */
	readonly stop: () => Effect.Effect<void>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link ListenerShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"Listener"`.  Provide
 * either `HttpListenerLive` or `StdioListenerLive` to satisfy this
 * tag at startup.
 */
export class Listener extends Context.Tag("Listener")<
	Listener,
	ListenerShape
>() { }
