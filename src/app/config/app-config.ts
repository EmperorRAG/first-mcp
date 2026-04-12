/**
 * Application configuration service built on Effect Config.
 *
 * @remarks
 * Reads server identity and network binding from typed configuration,
 * falling back to defaults when environment variables are missing.
 * Replaces the manual `createServerConfig()` / `getPort()` pattern
 * with Effect's built-in `Config` module.
 *
 * @module
 */
import { Config, Effect } from "effect";

/**
 * Application configuration for the MCP server.
 *
 * @remarks
 * Provides server identity (name, version) and network binding (port).
 * Port configuration uses `Config.number`, which rejects non-numeric
 * `PORT` values at the config layer rather than silently returning `NaN`.
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
