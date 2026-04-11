export const SERVER_NAME = "coffee-mate";
export const SERVER_VERSION = "1.0.0";
export const DEFAULT_PORT = 3001;

export function getPort(): number {
	return parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
}
