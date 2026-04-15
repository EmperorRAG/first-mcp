/**
 * Unit tests for the {@link HttpTransportLive} layer verifying the
 * parse/respond/handleMcp contract.
 *
 * @remarks
 * Tests validate that `HttpTransportLive` correctly satisfies the
 * shared {@link Transport} tag with the new protocol-adapter interface
 * (parse, respond, handleMcp).  HTTP-level integration tests that
 * exercise the full request lifecycle live in the MCP server service
 * tests.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { HttpTransportLive } from "./http-transport.js";
import { Transport } from "../transport.js";

describe("http-transport", () => {
	it("HttpTransportLive resolves Transport from the container", async () => {
		const transport = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* Transport;
			}).pipe(Effect.provide(HttpTransportLive)),
		);
		expect(typeof transport.parse).toBe("function");
		expect(typeof transport.respond).toBe("function");
		expect(typeof transport.handleMcp).toBe("function");
	});
});
