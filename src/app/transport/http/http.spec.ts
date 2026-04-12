/**
 * Unit tests for the HTTP transport module, verifying `startHttpServer` is exported.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { startHttpServer } from "./http.js";
import { isFunctionValue } from "../../testing/utility/reflect.utility.js";

describe("startHttpServer", () => {
	it("exports a function", () => {
		expect(isFunctionValue(startHttpServer)).toBe(true);
	});
});
