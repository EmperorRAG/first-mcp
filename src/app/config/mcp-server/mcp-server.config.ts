/**
 * Configuration shape for the MCP server instance.
 *
 * @remarks
 * Provides the server identity (name, version) and network binding (port).
 * Created by {@link createServerConfig} with environment-aware defaults.
 */
export interface ServerConfig {
	/** MCP server name advertised during protocol handshake. */
	readonly name: string;
	/** MCP server version advertised during protocol handshake. */
	readonly version: string;
	/** TCP port the HTTP transport listens on. */
	readonly port: number;
}

/** MCP server name used in protocol handshake. */
export const SERVER_NAME = "coffee-mate";
/** MCP server version used in protocol handshake. */
export const SERVER_VERSION = "1.0.0";
/** Default TCP port when the `PORT` environment variable is not set. */
export const DEFAULT_PORT = 3001;

/**
 * Reads the TCP port from the `PORT` environment variable.
 *
 * @returns The parsed port number, or {@link DEFAULT_PORT} if unset.
 */
export function getPort(): number {
	return parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
}

/**
 * Creates a frozen server configuration with environment-aware defaults.
 *
 * @returns An immutable {@link ServerConfig} object.
 *
 * @remarks
 * The port is resolved from the `PORT` environment variable, falling back
 * to {@link DEFAULT_PORT}. The returned object is frozen to prevent mutation.
 */
export function createServerConfig(): ServerConfig {
	return Object.freeze({
		name: SERVER_NAME,
		version: SERVER_VERSION,
		port: getPort(),
	});
}
