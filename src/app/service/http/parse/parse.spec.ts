/**
 * Smoke test for the standalone {@link parse} primitive.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { parse } from "./parse.js";

describe("parse", () => {
	it("is a function", () => {
		expect(typeof parse).toBe("function");
	});
});
