/**
 * Unit tests for the stdio transport module.
 *
 * @remarks
 * The stdio transport takes exclusive ownership of `process.stdin` /
 * `process.stdout`, making full integration tests impractical within the
 * same process.  This suite therefore limits itself to verifying the
 * module's public export surface — confirming that {@link startStdioServer}
 * is present and callable.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { startStdioServer } from "./stdio.js";
import { isFunctionValue } from "../../testing/utility/reflect.utility.js";

describe("startStdioServer", () => {
	it("exports a function", () => {
		expect(isFunctionValue(startStdioServer)).toBe(true);
	});
});
