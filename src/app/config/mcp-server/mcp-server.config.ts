export interface ServerConfig {
	readonly name: string;
	readonly version: string;
	readonly port: number;
}

export const SERVER_NAME = "coffee-mate";
export const SERVER_VERSION = "1.0.0";
export const DEFAULT_PORT = 3001;

export function getPort(): number {
	return parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
}

export function createServerConfig(): ServerConfig {
	return Object.freeze({
		name: SERVER_NAME,
		version: SERVER_VERSION,
		port: getPort(),
	});
}
