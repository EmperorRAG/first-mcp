/**
 * Unit tests for the {@link AppConfig} Effect service.
 *
 * @remarks
 * Each test constructs the {@link AppConfig} service in an isolated Effect
 * pipeline, providing `AppConfig.Default` and overriding the
 * {@link ConfigProvider} with `ConfigProvider.fromMap` so that individual
 * configuration keys can be set (or omitted) deterministically.  This
 * avoids any dependency on real environment variables.
 *
 * The suite validates:
 *
 * - Default values for `SERVER_NAME`, `SERVER_VERSION`, and `PORT` when
 *   the corresponding keys are absent from the config provider.
 * - Custom values are read correctly when present.
 * - Non-numeric `PORT` values produce an `Exit.Failure`, verifying that
 *   {@link Config.number} rejects invalid input at the config layer.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { ConfigProvider, Effect } from "effect";
import { AppConfig } from "./app-config.js";

describe("AppConfig", () => {
	it("provides default name 'coffee-mate' when SERVER_NAME is unset", async () => {
		const config = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* AppConfig;
			}).pipe(
				Effect.provide(AppConfig.Default),
				Effect.withConfigProvider(ConfigProvider.fromMap(new Map())),
			),
		);
		expect(config.name).toBe("coffee-mate");
	});

	it("provides default version '1.0.0' when SERVER_VERSION is unset", async () => {
		const config = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* AppConfig;
			}).pipe(
				Effect.provide(AppConfig.Default),
				Effect.withConfigProvider(ConfigProvider.fromMap(new Map())),
			),
		);
		expect(config.version).toBe("1.0.0");
	});

	it("provides default port 3001 when PORT is unset", async () => {
		const config = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* AppConfig;
			}).pipe(
				Effect.provide(AppConfig.Default),
				Effect.withConfigProvider(ConfigProvider.fromMap(new Map())),
			),
		);
		expect(config.port).toBe(3001);
	});

	it("reads SERVER_NAME from config provider", async () => {
		const config = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* AppConfig;
			}).pipe(
				Effect.provide(AppConfig.Default),
				Effect.withConfigProvider(
					ConfigProvider.fromMap(
						new Map([["SERVER_NAME", "test-server"]]),
					),
				),
			),
		);
		expect(config.name).toBe("test-server");
	});

	it("reads PORT from config provider as number", async () => {
		const config = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* AppConfig;
			}).pipe(
				Effect.provide(AppConfig.Default),
				Effect.withConfigProvider(
					ConfigProvider.fromMap(new Map([["PORT", "5000"]])),
				),
			),
		);
		expect(config.port).toBe(5000);
	});

	it("rejects non-numeric PORT values", async () => {
		const result = await Effect.runPromiseExit(
			Effect.gen(function* () {
				return yield* AppConfig;
			}).pipe(
				Effect.provide(AppConfig.Default),
				Effect.withConfigProvider(
					ConfigProvider.fromMap(new Map([["PORT", "not-a-number"]])),
				),
			),
		);
		expect(result._tag).toBe("Failure");
	});
});
