/**
 * Application configuration service built on Effect's {@link Config} module.
 *
 * @remarks
 * Centralises the MCP server's runtime configuration — server identity
 * (`SERVER_NAME`, `SERVER_VERSION`), network binding (`PORT`), and
 * transport selection (`TRANSPORT_MODE`) — behind an Effect
 * {@link Effect.Service}.  Each configuration key is read via a typed
 * accessor ({@link Config.string} or {@link Config.number}) and piped
 * through {@link Config.withDefault} so the server can start without any
 * environment variables set.
 *
 * `TRANSPORT_MODE` is validated at the config layer via
 * {@link Config.validate}: only `"http"` and `"stdio"` are accepted.
 * Any other value causes a config error at startup.
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
 * Union of supported transport modes for the MCP server.
 *
 * @remarks
 * Used by {@link AppConfig} to type the `mode` property.  Only `"http"`
 * and `"stdio"` are valid values; any other string supplied via the
 * `TRANSPORT_MODE` environment variable will cause a config-layer error
 * at startup.
 */
export type TransportMode = "http" | "stdio";

/**
 * Set of valid {@link TransportMode} values, used for runtime validation
 * inside {@link AppConfig}.
 *
 * @internal
 */
const VALID_TRANSPORT_MODES: ReadonlySet<string> = new Set<TransportMode>(["http", "stdio"]);

/**
 * Type guard that narrows a `string` to {@link TransportMode}.
 *
 * @param value - The string value to check.
 * @returns `true` when the value is `"http"` or `"stdio"`.
 *
 * @internal
 */
function isTransportMode(value: string): value is TransportMode {
	return VALID_TRANSPORT_MODES.has(value);
}

/**
 * Effect {@link Effect.Service} that provides typed, validated application
 * configuration for the MCP server.
 *
 * @remarks
 * The service is registered under the tag `"AppConfig"` and constructed
 * via an {@link Effect.gen} block that yields four configuration values:
 *
 * | Key | Accessor | Default | Description |
 * |-----|----------|---------|-------------|
 * | `SERVER_NAME` | {@link Config.string} | `"coffee-mate"` | Human-readable server identity sent during MCP `initialize` |
 * | `SERVER_VERSION` | {@link Config.string} | `"1.0.0"` | Semver version reported to MCP clients |
 * | `PORT` | {@link Config.number} | `3001` | TCP port for the HTTP transport |
 * | `TRANSPORT_MODE` | {@link Config.string} | `"http"` | Transport mode — `"http"` or `"stdio"` |
 *
 * The `TRANSPORT_MODE` value is validated at the config layer: any string
 * outside the {@link TransportMode} union causes an immediate config error.
 * The `--stdio` CLI flag in `main.ts` can override this value at runtime.
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
 *   console.log(config.name, config.port, config.mode);
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
		const modeRaw = yield* Config.string("TRANSPORT_MODE").pipe(
			Config.withDefault("http"),
			Config.validate({
				message: "TRANSPORT_MODE must be 'http' or 'stdio'",
				validation: isTransportMode,
			}),
		);
		const mode: TransportMode = modeRaw;
		return { name, version, port, mode } as const;
	}),
}) { }
