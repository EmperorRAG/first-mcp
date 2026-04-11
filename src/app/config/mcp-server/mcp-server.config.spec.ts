import { describe, it, expect, afterEach } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
	DEFAULT_PORT,
	getPort,
	createServerConfig,
} from "./mcp-server.config.js";

describe("server.config", () => {
	afterEach(() => {
		delete process.env.PORT;
	});

	it("exports SERVER_NAME as 'coffee-mate'", () => {
		expect(SERVER_NAME).toBe("coffee-mate");
	});

	it("exports SERVER_VERSION as '1.0.0'", () => {
		expect(SERVER_VERSION).toBe("1.0.0");
	});

	it("exports DEFAULT_PORT as 3001", () => {
		expect(DEFAULT_PORT).toBe(3001);
	});

	it("getPort returns DEFAULT_PORT when PORT env is not set", () => {
		delete process.env.PORT;
		expect(getPort()).toBe(DEFAULT_PORT);
	});

	it("getPort returns PORT env value as number", () => {
		process.env.PORT = "4000";
		expect(getPort()).toBe(4000);
	});
});

describe("createServerConfig", () => {
	afterEach(() => {
		delete process.env.PORT;
	});

	it("returns a frozen config object with default values", () => {
		delete process.env.PORT;
		const config = createServerConfig();
		expect(config.name).toBe(SERVER_NAME);
		expect(config.version).toBe(SERVER_VERSION);
		expect(config.port).toBe(DEFAULT_PORT);
		expect(Object.isFrozen(config)).toBe(true);
	});

	it("reads PORT from environment", () => {
		process.env.PORT = "5000";
		const config = createServerConfig();
		expect(config.port).toBe(5000);
	});
});
