/**
 * Contract BDD step definitions for MCP server configuration.
 * Covers type, format, and range assertions for configuration exports.
 *
 * @module
 */
import { Given, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
	DEFAULT_PORT,
} from "../mcp-server.config.js";
import { setPortEnv } from "../../../testing/utility/env.utility.js";

Given(
	"the PORT environment variable is set to {string}",
	(_world: QuickPickleWorldInterface, value: string) => {
		setPortEnv(value);
	},
);

Then("SERVER_NAME should be a non-empty string", (_world: QuickPickleWorldInterface) => {
	expect(typeof SERVER_NAME).toBe("string");
	expect(SERVER_NAME.length).toBeGreaterThan(0);
});

Then("SERVER_VERSION should match semver format", (_world: QuickPickleWorldInterface) => {
	expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
});

Then(
	"DEFAULT_PORT should be a number between {int} and {int}",
	(_world: QuickPickleWorldInterface, min: number, max: number) => {
		expect(typeof DEFAULT_PORT).toBe("number");
		expect(DEFAULT_PORT).toBeGreaterThanOrEqual(min);
		expect(DEFAULT_PORT).toBeLessThanOrEqual(max);
	},
);

Then("the port should be a number", (world: QuickPickleWorldInterface) => {
	expect(typeof world.port).toBe("number");
});
