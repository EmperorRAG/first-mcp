/**
 * Unit BDD step definitions for MCP server configuration.
 * Covers exact value assertions for SERVER_NAME, SERVER_VERSION, DEFAULT_PORT, and default port resolution.
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
import { clearPortEnv } from "../../../testing/utility/env.utility.js";

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
