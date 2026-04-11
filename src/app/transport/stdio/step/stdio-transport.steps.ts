import { Given, Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";
import { startStdioServer } from "../stdio.js";

Given("the stdio transport module is loaded", (_world: QuickPickleWorldInterface) => {
	// Module imports verified at top level
});

Then("startStdioServer should be a function", (_world: QuickPickleWorldInterface) => {
	expect(typeof startStdioServer).toBe("function");
});
