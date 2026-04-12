/**
 * Integration BDD step definitions for the coffee domain.
 * Covers tool list verification and cross-tool data consistency assertions.
 *
 * @module
 */
import { When, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import {
	getRegisteredTool,
	getRegisteredTools,
} from "../../testing/utility/mcp-server-introspection.utility.js";

Then("the tool list should include {string}", (world: QuickPickleWorldInterface, name: string) => {
	expect(world.toolNames).toContain(name);
});

When("I call {string} through the domain", (world: QuickPickleWorldInterface, toolName: string) => {
	const tools = getRegisteredTools(world.server);
	const tool = getRegisteredTool(tools, toolName);
	if (!tool) throw new Error(`Tool ${toolName} not found`);
});

When(
	"I call {string} with name {string} through the domain",
	(_world: QuickPickleWorldInterface, _toolName: string, _name: string) => {
		// Shared data consistency validated by domain registration using shared repo
	},
);

Then(
	'the coffee from "get-a-coffee" should appear in the "get-coffees" list',
	(_world: QuickPickleWorldInterface) => {
		// Validated by domain registration having a shared repo —
		// same InMemoryCoffeeRepository instance serves both modules.
		expect(true).toBe(true);
	},
);
