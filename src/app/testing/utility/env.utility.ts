/**
 * Environment variable helpers for test isolation of the `PORT`
 * configuration.
 *
 * @deprecated Both exports in this module are deprecated.  The
 * Effect-TS migration replaces `process.env.PORT` with
 * `AppConfig` backed by `Config.withDefault`, and tests now
 * use `ConfigProvider.fromMap` for isolation instead of mutating
 * environment variables.  Will be removed in a future cleanup pass.
 *
 * @remarks
 * Provides symmetric set/clear helpers so tests can bracket
 * `process.env.PORT` mutations without leaking state.
 *
 * @module
 */
/**
 * Removes the `PORT` environment variable for test isolation.
 *
 * @deprecated No longer imported by any test.  Use
 * `ConfigProvider.fromMap` with Effect’s `Config` module instead.
 *
 * @remarks
 * Deletes `process.env.PORT` so subsequent reads return `undefined`,
 * exercising default-value code paths.
 */
export function clearPortEnv(): void {
	delete process.env.PORT;
}

/**
 * Sets the `PORT` environment variable to a given value.
 *
 * @deprecated No longer imported by any test.  Use
 * `ConfigProvider.fromMap` with Effect’s `Config` module instead.
 *
 * @remarks
 * Assigns `process.env.PORT` directly.  Callers should call
 * {@link clearPortEnv} in an `afterEach` block to avoid leaking
 * state between tests.
 *
 * @param value - The port string to assign (e.g., `"4000"`).
 */
export function setPortEnv(value: string): void {
	process.env.PORT = value;
}