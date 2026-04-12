/**
 * Contract BDD step definitions for the HTTP transport component.
 * Covers response content-type and body field type/presence assertions.
 *
 * @module
 */
import { Then, type QuickPickleWorldInterface } from "quickpickle";
import { expect } from "vitest";

Then(
	"the response content-type should be {string}",
	(world: QuickPickleWorldInterface, contentType: string) => {
		const ct = world.httpResponse!.headers.get("content-type") ?? "";
		expect(ct).toContain(contentType);
	},
);

Then(
	"the response body should have a {string} field of type {string}",
	(world: QuickPickleWorldInterface, field: string, type: string) => {
		expect(world.responseBody).toHaveProperty(field);
		expect(typeof world.responseBody[field]).toBe(type);
	},
);

Then(
	"the response body should have an {string} field",
	(world: QuickPickleWorldInterface, field: string) => {
		expect(world.responseBody).toHaveProperty(field);
	},
);
