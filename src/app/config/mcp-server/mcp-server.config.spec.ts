import { describe, it, expect, afterEach } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
	DEFAULT_PORT,
	getPort,
	createServerConfig,
} from "./mcp-server.config.js";
import { clearPortEnv, setPortEnv } from "../../testing/utility/env.utility.js";

describe("server.config", () => {
	afterEach(() => {
		clearPortEnv();
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
		clearPortEnv();
		expect(getPort()).toBe(DEFAULT_PORT);
	});

	it("getPort returns PORT env value as number", () => {
		setPortEnv("4000");
		expect(getPort()).toBe(4000);
	});
});

describe("createServerConfig", () => {
	afterEach(() => {
		clearPortEnv();
	});

	it("returns a frozen config object with default values", () => {
		clearPortEnv();
		const config = createServerConfig();
		expect(config.name).toBe(SERVER_NAME);
		expect(config.version).toBe(SERVER_VERSION);
		expect(config.port).toBe(DEFAULT_PORT);
		expect(Object.isFrozen(config)).toBe(true);
	});

	it("reads PORT from environment", () => {
		setPortEnv("5000");
		const config = createServerConfig();
		expect(config.port).toBe(5000);
	});
});
