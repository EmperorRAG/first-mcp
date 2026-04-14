/**
 * Application configuration service built on Effect's {@link Config} module.
 *
 * @remarks
 * Centralises the MCP server's runtime configuration — server identity
 * (`SERVER_NAME`, `SERVER_VERSION`) and network binding (`PORT`) — behind
 * an Effect {@link Effect.Service}.  Each configuration key is read via a
 * typed accessor ({@link Config.string} or {@link Config.number}) and
 * piped through {@link Config.withDefault} so the server can start
 * without any environment variables set.
 *
 * This approach replaces the earlier manual `createServerConfig()` /
 * `getPort()` pattern.  Because {@link Config.number} performs numeric
 * parsing at the config layer, a non-numeric `PORT` value (e.g.
 * `"not-a-number"`) causes a config error at startup rather than silently
 * propagating `NaN` into the HTTP transport.
 *
 * @module
 */
import { Config, Effect } from "effect";

/**
 * Effect {@link Effect.Service} that provides typed, validated application
 * configuration for the MCP server.
 *
 * @remarks
 * The service is registered under the tag `"AppConfig"` and constructed
 * via an {@link Effect.gen} block that yields three configuration values:
 *
 * | Key | Accessor | Default | Description |
 * |-----|----------|---------|-------------|
 * | `SERVER_NAME` | {@link Config.string} | `"coffee-mate"` | Human-readable server identity sent during MCP `initialize` |
 * | `SERVER_VERSION` | {@link Config.string} | `"1.0.0"` | Semver version reported to MCP clients |
 * | `PORT` | {@link Config.number} | `3001` | TCP port for the HTTP transport |
 *
 * The returned object is narrowed with `as const` so that each property
 * retains its literal type at the call site.
 *
 * Provide the service via `AppConfig.Default` (which uses the ambient
 * `ConfigProvider`) or swap in a custom `ConfigProvider` for
 * testing.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { AppConfig } from "./app-config.js";
 *
 * const program = Effect.gen(function* () {
 *   const config = yield* AppConfig;
 *   console.log(config.name, config.port);
 * });
 *
 * await Effect.runPromise(program.pipe(Effect.provide(AppConfig.Default)));
 * ```
 */
export class AppConfig extends Effect.Service<AppConfig>()("AppConfig", {
	effect: Effect.gen(function* () {
		const name = yield* Config.string("SERVER_NAME").pipe(
			Config.withDefault("coffee-mate"),
		);
		const version = yield* Config.string("SERVER_VERSION").pipe(
			Config.withDefault("1.0.0"),
		);
		const port = yield* Config.number("PORT").pipe(
			Config.withDefault(3001),
		);
		return { name, version, port } as const;
	}),
}) { }
