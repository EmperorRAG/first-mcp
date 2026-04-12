/**
 * Contract BDD step definitions for the coffee domain.
 * Covers tool metadata assertions: description presence, input schema requirements.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import {
	getRegisteredTool,
	getRegisteredTools,
	getSchemaShape,
} from "../../testing/utility/mcp-server-introspection.utility.js";
import { getObjectProperty } from "../../testing/utility/reflect.utility.js";

Then(
	"the {string} tool should have a description",
	(world: QuickPickleWorldInterface, toolName: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = getRegisteredTool(tools, toolName);
		expect(tool).toBeDefined();
		expect(getObjectProperty(tool, "description")).toBeTruthy();
	},
);

Then(
	"the {string} tool should not require input",
	(world: QuickPickleWorldInterface, toolName: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = getRegisteredTool(tools, toolName);
		expect(tool).toBeDefined();
		expect(getObjectProperty(tool, "inputSchema")).toBeUndefined();
	},
);

Then(
	"the {string} tool should require a {string} input",
	(world: QuickPickleWorldInterface, toolName: string, field: string) => {
		const tools = getRegisteredTools(world.server);
		const tool = getRegisteredTool(tools, toolName);
		expect(tool).toBeDefined();
		const shape = getSchemaShape(getObjectProperty(tool, "inputSchema"));
		expect(shape).toBeDefined();
		expect(shape).toHaveProperty(field);
	},
);
