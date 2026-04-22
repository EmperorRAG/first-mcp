/**
 * Unit tests for the {@link StdioTransportLive} layer.
 *
 * @remarks
 * The stdio transport takes exclusive ownership of `process.stdin` /
 * `process.stdout`, making full integration tests impractical within the
 * same process.  This suite verifies the module's public export surface
 * — confirming that {@link StdioTransportLive} correctly satisfies the
 * shared {@link Transport} tag with the new parse/respond/handleMcp
 * interface.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { StdioTransportLive } from "./transport.js";
import { Transport } from "../../../transport/transport.js";

describe("StdioTransportLive", () => {
	it("resolves Transport from the container", async () => {
		const transport = await Effect.runPromise(
			Effect.gen(function* () {
				return yield* Transport;
			}).pipe(Effect.provide(StdioTransportLive)),
		);
		expect(typeof transport.parse).toBe("function");
		expect(typeof transport.respond).toBe("function");
		expect(typeof transport.handleMcp).toBe("function");
	});
});
