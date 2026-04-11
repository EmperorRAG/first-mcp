import { describe, it, expect } from "vitest";
import { startStdioServer } from "./stdio.js";
import { isFunctionValue } from "../../testing/utility/reflect.utility.js";

describe("startStdioServer", () => {
	it("exports a function", () => {
		expect(isFunctionValue(startStdioServer)).toBe(true);
	});
});
