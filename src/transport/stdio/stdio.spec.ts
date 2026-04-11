import { describe, it, expect } from "vitest";
import { startStdioServer } from "./stdio.js";

describe("startStdioServer", () => {
	it("exports a function", () => {
		expect(typeof startStdioServer).toBe("function");
	});
});
