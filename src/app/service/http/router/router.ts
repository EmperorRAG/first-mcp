/**
 * HTTP router implementation — resolves {@link McpRequest} DTOs into
 * {@link RouteAction} values for the HTTP transport.
 *
 * @remarks
 * Provides the {@link HttpRouterLive} layer satisfying the shared
 * {@link Router} tag for HTTP mode.  Resolution logic:
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
import { Effect, Layer } from "effect";
import { Router, type RouteAction } from "../../../router/router.js";
import { AppConfig } from "../../../config/app/app-config.js";

/**
 * Validates that a host string resolves to a loopback address or
 * appears in the configured allowed-hosts set, protecting against
 * DNS rebinding attacks.
 *
 * @remarks
 * DNS rebinding is a technique where an attacker's domain initially
 * resolves to a public IP (passing same-origin checks) and then
 * re-resolves to `127.0.0.1`, allowing malicious scripts to reach
 * local services.  By accepting only known loopback hostnames
 * (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`) **plus** any
 * hostnames explicitly listed in {@link AppConfig.allowedHosts},
 * the server rejects requests whose `Host` header was set by an
 * attacker-controlled DNS while still supporting named production
 * deployments (e.g. Azure Container Apps).
 *
 * The port suffix (e.g. `:3001`) is stripped before comparison.
 *
 * @param host - The raw `Host` header value, which may include a port.
 * @param allowedHosts - Additional hostnames to accept (from
 *        {@link AppConfig.allowedHosts}).
 * @returns `true` when the hostname portion is a recognized loopback
 *          address or is in the allowed-hosts set; `false` otherwise
 *          (including when `host` is `undefined`).
 *
 * @see {@link https://owasp.org/www-community/attacks/DNS_Rebinding | OWASP — DNS Rebinding}
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
 * {@link Layer} providing the HTTP implementation of the shared
 * {@link Router} tag.
 *
 * @remarks
 * Constructed via {@link Layer.effect} — depends on {@link AppConfig}
 * to read the {@link AppConfig.allowedHosts | allowedHosts} set for
 * the DNS rebinding guard.
 *
 * Provide this layer when {@link AppConfig.mode} is `"http"`.
 *
 * @example
 * ```ts
 * import { Layer } from "effect";
 * import { HttpRouterLive } from "./http-router.js";
 *
 * const AppLive = Layer.mergeAll(HttpRouterLive, HttpTransportLive);
 * ```
 */
export const HttpRouterLive: Layer.Layer<Router, never, AppConfig> = Layer.effect(
	Router,
	Effect.gen(function* () {
		const { allowedHosts } = yield* AppConfig;

		return {
			resolve: (request) =>
				Effect.sync((): RouteAction => {
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
				}),
		};
	}),
);
