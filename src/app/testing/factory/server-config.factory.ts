/**
 * Test ServerConfig fixtures and factory with OS-assigned port defaults.
 *
 * @module
 */
import type { ServerConfig } from "../../config/mcp-server/mcp-server.config.js";

/** Default ServerConfig fixture with port `0` for OS-assigned port in tests. */
export const defaultTestServerConfig: ServerConfig = {
	name: "test-server",
	version: "0.0.1",
	port: 0,
};

/**
 * Creates a ServerConfig with optional property overrides.
 *
 * @param overrides - Partial ServerConfig properties to override defaults.
 * @returns A complete ServerConfig entity.
 */
export function createTestServerConfig(
	overrides: Partial<ServerConfig> = {},
): ServerConfig {
	return {
		...defaultTestServerConfig,
		...overrides,
	};
}