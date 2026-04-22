/**
 * Declares the shared listener abstraction used by application startup.
 * This module defines both the service contract and the dependency
 * injection tag that represent the active transport listener.
 *
 * @remarks
 * The abstractions in this file keep bootstrap logic transport-agnostic.
 * Callers depend on {@link ListenerTag}, not concrete implementations.
 *
 * Startup uses this module in three phases:
 *
 * 1. A concrete layer provides {@link ListenerInterface}.
 * 2. The runtime resolves {@link ListenerTag} from the environment.
 * 3. Entrypoint code invokes lifecycle methods on the resolved service.
 *
 * This separation allows HTTP and stdio listeners to share one startup
 * path while preserving strict dependency inversion.
 *
 * @module
 */
import { Context, type Effect } from "effect";

/**
 * Service contract for an MCP server listener.
 * Implementations expose a minimal lifecycle surface for transport
 * startup and shutdown.
 *
 * @remarks
 * Every listener implementation provides two lifecycle methods:
 *
 * | Method | Responsibility |
 * |--------|---------------|
 * | {@link start} | Binds the server and begins accepting connections |
 * | {@link stop} | Closes the server and tears down all sessions |
 *
 * The interface intentionally avoids transport-specific details such as
 * host binding or stream ownership.  Those concerns remain internal to
 * concrete layers.
 *
 * @example
 * ```ts
 * const listener = yield* ListenerTag;
 *
 * yield* listener.start();
 * // ... run program lifecycle ...
 * yield* listener.stop();
 * ```
 */
export interface ListenerInterface {
	/**
	 * Starts the active listener implementation.
	 *
	 * @remarks
	 * For HTTP mode this binds the TCP server.  For stdio mode this
	 * initializes the singleton MCP session transport.
	 *
	 * @returns An effect that completes when startup succeeds or fails
	 * with the implementation's typed error channel.
	 */
	readonly start: () => Effect.Effect<void>;
	/**
	 * Stops the active listener implementation and releases resources.
	 *
	 * @remarks
	 * Implementations should perform graceful teardown, including session
	 * cleanup and transport disposal, before completing.
	 *
	 * @returns An effect that completes when shutdown is finished.
	 */
	readonly stop: () => Effect.Effect<void>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link ListenerInterface}
 * service in the dependency graph.
 *
 * @remarks
 * The tag is registered with the identifier `"Listener"` and acts as
 * the single lookup key for listener lifecycle operations.
 *
 * At composition time, startup wiring provides one concrete layer that
 * satisfies this tag, usually an HTTP listener layer or stdio listener
 * layer depending on resolved transport mode.
 *
 * @example
 * ```ts
 * const program = Effect.gen(function* () {
 * 	const listener = yield* ListenerTag;
 * 	yield* listener.start();
 * });
 * ```
 */
export class ListenerTag extends Context.Tag("Listener")<
	ListenerTag,
	ListenerInterface
>() { }
