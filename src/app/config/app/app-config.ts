/**
 * Application configuration service built on Effect's {@link Config} module.
 *
 * @remarks
 * Centralises the MCP server's runtime configuration — server identity
 * (`SERVER_NAME`, `SERVER_VERSION`), network binding (`PORT`),
 * transport selection (`TRANSPORT_MODE`), and tool activation
 * (`ACTIVE_TOOLS`) — behind an Effect {@link Effect.Service}.  Each
 * configuration key is read via a typed accessor ({@link Config.string}
 * or {@link Config.number}) and piped through {@link Config.withDefault}
 * so the server can start without any environment variables set.
 *
 * `TRANSPORT_MODE` is validated at the config layer via
 * {@link Config.validate}: only `"http"` and `"stdio"` are accepted.
 * Any other value causes a config error at startup.
 *
 * `ACTIVE_TOOLS` is a comma-separated list of tool names that should be
 * registered on the MCP server.  Tools not listed are inactive by default
 * (opt-in model).  An empty string (the default) means no tools are
 * registered.
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
import type { ActiveToolsRecord } from "../../server/mcp/registerable-tool.js";

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
 * Parses a comma-separated string of tool names into an
 * {@link ActiveToolsRecord}.
 *
 * @remarks
 * Splits on commas, trims whitespace from each segment, and filters
 * out empty strings.  Each remaining name is mapped to `true` in the
 * returned record.  An empty input string produces an empty record
 * (no tools active).
 *
 * @param raw - The raw `ACTIVE_TOOLS` environment variable value.
 * @returns A record mapping each listed tool name to `true`.
 *
 * @internal
 */
function parseActiveTools(raw: string): ActiveToolsRecord {
	const entries = raw
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	return Object.fromEntries(entries.map((name) => [name, true]));
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
 * | `ACTIVE_TOOLS` | {@link Config.string} | `""` | Comma-separated tool names to register (opt-in) |
 * | `ACTIVE_TOOLS` | {@link Config.string} | `""` | Comma-separated tool names to register (opt-in) |
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
 *   console.log(config.name, config.port, config.mode, config.activeTools);
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
		const activeToolsRaw = yield* Config.string("ACTIVE_TOOLS").pipe(
			Config.withDefault(""),
		);
		const activeTools: ActiveToolsRecord = parseActiveTools(activeToolsRaw);
		return { name, version, port, mode, activeTools } as const;
	}),
}) { }
