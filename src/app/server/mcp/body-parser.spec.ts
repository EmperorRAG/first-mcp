/**
 * Unit tests for the {@link parseBody} HTTP body parser.
 *
 * @remarks
 * Validates JSON parsing from Node.js {@link IncomingMessage} streams,
 * including valid JSON, empty body, malformed JSON, and stream error
 * scenarios.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { parseBody } from "./body-parser.js";

/**
 * Creates a fake {@link IncomingMessage} from a string payload.
 *
 * @param data - The raw string to emit as stream data.
 * @returns A {@link Readable} cast to {@link IncomingMessage}.
 *
 * @internal
 */
const fakeRequest = (data: string): IncomingMessage => {
	const stream = new Readable({
		read() {
			this.push(data);
			this.push(null);
		},
	});
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return stream as unknown as IncomingMessage;
};

/**
 * Validates that {@link parseBody} correctly handles various HTTP
 * request body inputs.
 */
describe("parseBody", () => {
	/**
	 * A well-formed JSON body should be parsed and returned as the
	 * corresponding JavaScript value.
	 */
	it("parses valid JSON body", async () => {
		const req = fakeRequest(JSON.stringify({ hello: "world" }));
		const result = await Effect.runPromise(parseBody(req));
		expect(result).toEqual({ hello: "world" });
	});

	/**
	 * An empty body should yield `undefined` rather than a parse error.
	 */
	it("returns undefined for empty body", async () => {
		const req = fakeRequest("");
		const result = await Effect.runPromise(parseBody(req));
		expect(result).toBeUndefined();
	});

	/**
	 * Malformed JSON should cause the effect to fail with an
	 * `"Invalid JSON"` error.
	 */
	it("fails with Error for invalid JSON", async () => {
		const req = fakeRequest("not-json{");
		const result = await Effect.runPromise(
			parseBody(req).pipe(
				Effect.catchAll((err) => Effect.succeed(err)),
			),
		);
		expect(result).toBeInstanceOf(Error);
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		expect((result as Error).message).toBe("Invalid JSON");
	});
});
