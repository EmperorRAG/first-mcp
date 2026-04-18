/**
 * Unit tests for the {@link CoffeeDomain} Effect service.
 *
 * @remarks
 * Each test provides {@link CoffeeDomain.Default}, which bundles both
 * child services ({@link GetCoffeesService}, {@link GetACoffeeService})
 * and their repository dependencies.  Validates that the domain
 * composes correctly and exposes named {@link RegisterableTool}
 * properties with the expected `metaData`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { CoffeeDomain } from "./domain.js";

/** @internal */
const runWithDomain = <A>(effect: Effect.Effect<A, never, CoffeeDomain>) =>
	Effect.runPromise(Effect.provide(effect, CoffeeDomain.Default));

describe("CoffeeDomain", () => {
	it("exposes getCoffees as a RegisterableTool", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.getCoffees.metaData.name).toBe("get-coffees");
		expect(domain.getCoffees.executeFormatted).toBeTypeOf("function");
	});

	it("exposes getACoffee as a RegisterableTool with inputSchema", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.getACoffee.metaData.name).toBe("get-a-coffee");
		expect(domain.getACoffee.inputSchema).toBeDefined();
		expect(domain.getACoffee.executeFormatted).toBeTypeOf("function");
	});

	it("getCoffees.executeFormatted returns MCP-shaped response", async () => {
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const domain = yield* CoffeeDomain;
				return yield* domain.getCoffees.executeFormatted(undefined);
			}).pipe(Effect.provide(CoffeeDomain.Default)),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		expect(parsed).toHaveLength(4);
	});

	it("getACoffee.executeFormatted returns MCP-shaped response", async () => {
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const domain = yield* CoffeeDomain;
				return yield* domain.getACoffee.executeFormatted({ name: "Espresso" });
			}).pipe(Effect.provide(CoffeeDomain.Default)),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(parsed.name).toBe("Espresso");
	});
});
