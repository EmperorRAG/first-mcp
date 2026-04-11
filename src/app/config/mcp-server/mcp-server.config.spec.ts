import { describe, it, expect, afterEach } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
	DEFAULT_PORT,
	getPort,
} from "./mcp-server.config.js";

describe("server.config", () => {
	afterEach(() => {
		delete process.env["PORT"];
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
		delete process.env["PORT"];
		expect(getPort()).toBe(DEFAULT_PORT);
	});

	it("getPort returns PORT env value as number", () => {
		process.env["PORT"] = "4000";
		expect(getPort()).toBe(4000);
	});
});
