/**
 * Resolves an {@link McpRequest} into a {@link RouteAction} for HTTP
 * dispatch. Inlines the previous `HttpRouterLive` logic plus the
 * shared `RouteAction` union.
 *
 * @remarks
 * Resolution order:
 *
 * 1. DNS rebinding guard (host validation) → `"forbidden"`
 * 2. `OPTIONS` → `"cors-preflight"`
 * 3. `GET /health` → `"health-check"`
 * 4. `POST /mcp` → `"mcp-message"`
 * 5. `GET /mcp` → `"mcp-sse"`
 * 6. `DELETE /mcp` → `"session-terminate"`
 * 7. Anything else → `"not-found"`
 *
 * @module
 */
import { Effect } from "effect";
import type { McpRequest } from "../../../schema/request/mcp-request.js";
import { AppConfig } from "../../../config/app/app-config.js";

/**
 * Discriminated union of all possible HTTP route outcomes.
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
 * Validates the `Host` header against loopback addresses and the
 * configured allowed-hosts set, protecting against DNS rebinding.
 *
 * @internal
 */
function isValidHost(
	host: string | undefined,
	allowedHosts: ReadonlySet<string>,
): boolean {
	if (!host) return false;
	const hostname = host.split(":")[0].toLowerCase();
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "0.0.0.0" ||
		hostname === "::1" ||
		allowedHosts.has(hostname)
	);
}

/**
 * Resolves the {@link RouteAction} for a parsed {@link McpRequest}.
 */
export const resolve = (
	request: McpRequest,
): Effect.Effect<RouteAction, never, AppConfig> =>
	Effect.gen(function* () {
		const { allowedHosts } = yield* AppConfig;
		if (!isValidHost(request.host, allowedHosts)) return "forbidden";
		if (request.method === "OPTIONS") return "cors-preflight";
		if (request.path === "/health" && request.method === "GET")
			return "health-check";
		if (request.path === "/mcp" && request.method === "POST")
			return "mcp-message";
		if (request.path === "/mcp" && request.method === "GET")
			return "mcp-sse";
		if (request.path === "/mcp" && request.method === "DELETE")
			return "session-terminate";
		return "not-found";
	});
