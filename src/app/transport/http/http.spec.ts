import { describe, it, expect } from "vitest";
import { startHttpServer } from "./http.js";

describe("startHttpServer", () => {
	it("exports a function", () => {
		expect(typeof startHttpServer).toBe("function");
	});
});
