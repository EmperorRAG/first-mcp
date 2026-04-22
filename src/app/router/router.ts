/**
 * Shared router abstraction — {@link Context.Tag}, {@link RouterShape}
 * interface, and {@link RouteAction} union for dependency-injected
 * request routing.
 *
 * @remarks
 * Defines a polymorphic {@link Router} tag that both
 * {@link HttpRouterLive} satisfies.  The
 * router maps an {@link McpRequest} DTO to a {@link RouteAction} string
 * that the {@link McpServerService} uses to dispatch the request.
 *
 * @module
 */
import { Context, type Effect } from "effect";
import type { McpRequest } from "../schema/request/mcp-request.js";

/**
 * Discriminated union of all possible route outcomes.
 *
 * @remarks
 * The {@link McpServerService} switches on this value to determine
 * how to handle each incoming request:
 *
 * | Action | Meaning |
 * |--------|---------|
 * | `"mcp-message"` | Forward to MCP SDK transport (POST /mcp) |
 * | `"mcp-sse"` | SSE backward-compatibility stream (GET /mcp) |
 * | `"session-terminate"` | Close session (DELETE /mcp) |
 * | `"health-check"` | Liveness probe (GET /health) |
 * | `"cors-preflight"` | CORS OPTIONS response |
 * | `"not-found"` | No matching route |
 * | `"forbidden"` | DNS rebinding or access denial |
 */
export type RouteAction =
	| "mcp-message"
	| "mcp-sse"
	| "session-terminate"
	| "health-check"
	| "cors-preflight"
	| "not-found"
	| "forbidden";

/**
 * Service contract for an MCP request router.
 *
 * @remarks
 * Every router implementation provides a single {@link resolve} method
 * that inspects an {@link McpRequest} and returns the appropriate
 * {@link RouteAction}.  The action tells the {@link McpServerService}
 * what to do with the request without coupling routing logic to the
 * server orchestration.
 */
export interface RouterShape {
	/**
	 * Inspects an {@link McpRequest} and determines the
	 * {@link RouteAction} to take.
	 *
	 * @remarks
	 * - **HTTP router**: checks DNS rebinding, CORS, health endpoint,
	 *   MCP paths, and falls back to `"not-found"`.
	 * - **Stdio router**: always returns `"mcp-message"`.
	 *
	 * @param request - The parsed {@link McpRequest} DTO.
	 * @returns An {@link Effect.Effect} yielding the resolved
	 *          {@link RouteAction}.
	 */
	readonly resolve: (request: McpRequest) => Effect.Effect<RouteAction>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link RouterShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"Router"`.  Consumer code
 * yields this tag inside an {@link Effect.gen} block to obtain the
 * router implementation provided by the current {@link Layer} — either
 * `HttpRouterLive`, selected at startup based
 * on {@link AppConfig.mode}.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Router } from "./router.js";
 *
 * const program = Effect.gen(function* () {
 *   const router = yield* Router;
 *   const action = yield* router.resolve(mcpRequest);
 * });
 * ```
 */
export class Router extends Context.Tag("Router")<
	Router,
	RouterShape
>() { }
