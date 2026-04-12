/**
 * Shared BDD step definitions for MCP server configuration.
 * Provides setup, cleanup, and cross-type steps used by both unit and contract features.
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
import { getPort } from "../mcp-server.config.js";
import { clearPortEnv } from "../../../testing/utility/env.utility.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		port: number;
	}
}

After((_world: QuickPickleWorldInterface) => {
	clearPortEnv();
});

Given("the server config is loaded", (_world: QuickPickleWorldInterface) => {
	// Module is imported at top level — no action needed
});

When("I call getPort", (world: QuickPickleWorldInterface) => {
	world.port = getPort();
});

Then("the port should be {int}", (world: QuickPickleWorldInterface, expected: number) => {
	expect(world.port).toBe(expected);
});
