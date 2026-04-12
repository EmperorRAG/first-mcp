/**
 * Environment variable helpers for test isolation of the `PORT` configuration.
 *
 * @module
 */
/** Removes the `PORT` environment variable for test isolation. */
export function clearPortEnv(): void {
	delete process.env.PORT;
}

/**
 * Sets the `PORT` environment variable.
 *
 * @param value - The port value to assign.
 */
export function setPortEnv(value: string): void {
	process.env.PORT = value;
}