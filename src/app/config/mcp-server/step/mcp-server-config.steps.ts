/**
 * BDD step definitions for MCP server configuration.
 * Covers unit and contract scenarios for server name, version, and port resolution.
 *
 * @module
 */
import {
	Given,
	When,
	Then,
	After,
	type QuickPickleWorldInterface,
} from "quickpickle";
import { expect } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
	DEFAULT_PORT,
	getPort,
} from "../mcp-server.config.js";
import {
	clearPortEnv,
	setPortEnv,
} from "../../../testing/utility/env.utility.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		port: number;
	}
}

After((_world: QuickPickleWorldInterface) => {
	clearPortEnv();
});

// Unit steps

Given("the server config is loaded", (_world: QuickPickleWorldInterface) => {
	// Module is imported at top level — no action needed
});

Then("SERVER_NAME should be {string}", (_world: QuickPickleWorldInterface, expected: string) => {
	expect(SERVER_NAME).toBe(expected);
});

Then("SERVER_VERSION should be {string}", (_world: QuickPickleWorldInterface, expected: string) => {
	expect(SERVER_VERSION).toBe(expected);
});

Then("DEFAULT_PORT should be {int}", (_world: QuickPickleWorldInterface, expected: number) => {
	expect(DEFAULT_PORT).toBe(expected);
});

Given("the PORT environment variable is not set", (_world: QuickPickleWorldInterface) => {
	clearPortEnv();
});

Given(
	"the PORT environment variable is set to {string}",
	(_world: QuickPickleWorldInterface, value: string) => {
		setPortEnv(value);
	},
);

When("I call getPort", (world: QuickPickleWorldInterface) => {
	world.port = getPort();
});

Then("the port should be {int}", (world: QuickPickleWorldInterface, expected: number) => {
	expect(world.port).toBe(expected);
});

// Contract steps

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
