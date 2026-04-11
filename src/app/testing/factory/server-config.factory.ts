import type { ServerConfig } from "../../config/mcp-server/mcp-server.config.js";

export const defaultTestServerConfig: ServerConfig = {
	name: "test-server",
	version: "0.0.1",
	port: 0,
};

export function createTestServerConfig(
	overrides: Partial<ServerConfig> = {},
): ServerConfig {
	return {
		...defaultTestServerConfig,
		...overrides,
	};
}