/**
 * Shared types and service tag for the MCP server orchestrator.
 *
 * @remarks
 * Centralises the {@link ToolRegistrationFn} callback signature,
 * the {@link McpServerServiceShape} service contract, and the
 * {@link McpServerService} Effect {@link Context.Tag} so that
 * consumers can depend on the tag without pulling in the full
 * lifecycle implementation from `mcp-server.ts`.
 *
 * @module
 */
import { Context, type Effect } from "effect";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManagedRuntime } from "effect";

/**
 * Callback signature for registering domain tools on an
 * {@link McpServer} instance.
 *
 * @remarks
 * The {@link McpServerService} invokes this callback once per
 * {@link McpServer} creation (once per session in HTTP mode, once at
 * startup in stdio mode).  The callback receives both the server and
 * a {@link ManagedRuntime} so that tool handlers can resolve domain
 * services via `runtime.runPromise`.
 *
 * @example
 * ```ts
 * const registerTools: ToolRegistrationFn = (server, runtime) => {
 *   registerCoffeeTools(server, runtime);
 * };
 * ```
 */
export type ToolRegistrationFn = (
	server: McpServer,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
) => void;

/**
 * Service contract for the MCP server orchestrator.
 *
 * @remarks
 * The single {@link start} method encapsulates the full server lifecycle
 * for the configured transport mode (HTTP or stdio).
 */
export interface McpServerServiceShape {
	/**
	 * Starts the MCP server in the configured transport mode.
	 *
	 * @remarks
	 * - **HTTP mode**: creates a `node:http` server, parses each
	 *   request through the {@link Transport} layer, routes via the
	 *   {@link Router}, and dispatches to the appropriate handler.
	 *   Registers {@link Effect.addFinalizer} for graceful shutdown.
	 * - **stdio mode**: creates a single {@link McpServer} +
	 *   `StdioServerTransport` and connects them.
	 *
	 * @returns An {@link Effect.Effect} that resolves once the server
	 *          is listening (HTTP) or connected (stdio).
	 */
	readonly start: () => Effect.Effect<void>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link McpServerServiceShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"McpServerService"`.  The
 * entry point (`main.ts`) resolves this tag and calls
 * {@link McpServerServiceShape.start | start()} to boot the server.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { McpServerService } from "./types.js";
 *
 * const program = Effect.gen(function* () {
 *   const svc = yield* McpServerService;
 *   yield* svc.start();
 * });
 * ```
 */
export class McpServerService extends Context.Tag("McpServerService")<
	McpServerService,
	McpServerServiceShape
>() { }
