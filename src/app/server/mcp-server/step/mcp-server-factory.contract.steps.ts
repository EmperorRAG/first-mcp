/**
 * Contract BDD step definitions for the MCP server factory.
 * Covers server name and version value assertions for `createMcpServer`.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
} from "../../../config/mcp-server/mcp-server.config.js";
import { getServerInfoValue } from "../../../testing/utility/mcp-server-introspection.utility.js";

Then("the server name should be {string}", (world: QuickPickleWorldInterface, name: string) => {
	expect(name).toBe(SERVER_NAME);
	const serverName = getServerInfoValue(world.serverInstance, "name");
	expect(serverName).toBe(name);
});

Then("the server version should be {string}", (world: QuickPickleWorldInterface, version: string) => {
	expect(version).toBe(SERVER_VERSION);
	const serverVersion = getServerInfoValue(world.serverInstance, "version");
	expect(serverVersion).toBe(version);
});
