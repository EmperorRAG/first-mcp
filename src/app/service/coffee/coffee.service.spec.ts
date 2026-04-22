/**
 * Unit tests for the {@link CoffeeDomain} Effect service.
 *
 * @remarks
 * Each test provides {@link CoffeeDomain.Default}, which bundles the
 * {@link CoffeeRepository} dependency.  Validates that the domain
 * composes correctly and exposes named executor properties whose
 * effects produce MCP-shaped responses.  Tool metadata, input
 * schemas, and MCP server registration live in
 * `service/mcp/register-coffee-tools/` and are covered by that
 * module's spec.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { CoffeeDomain } from "./coffee.service.js";

/**
 * Helper that runs an Effect with the {@link CoffeeDomain.Default}
 * layer providing both the domain service and its underlying
 * {@link CoffeeRepository}.
 *
 * @internal
 */
const runWithDomain = <A>(effect: Effect.Effect<A, never, CoffeeDomain>) =>
	Effect.runPromise(Effect.provide(effect, CoffeeDomain.Default));

describe("CoffeeDomain", () => {
	it("exposes getCoffees as an executor function", async () => {
		/** @internal */
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.getCoffees).toBeTypeOf("function");
	});

	it("exposes getACoffee as an executor function", async () => {
		/** @internal */
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.getACoffee).toBeTypeOf("function");
	});

	it("getCoffees returns MCP-shaped response", async () => {
		/** @internal */
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const domain = yield* CoffeeDomain;
				return yield* domain.getCoffees(undefined);
			}).pipe(Effect.provide(CoffeeDomain.Default)),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		expect(parsed).toHaveLength(4);
	});

	it("getACoffee returns MCP-shaped response", async () => {
		/** @internal */
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const domain = yield* CoffeeDomain;
				return yield* domain.getACoffee({ name: "Espresso" });
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
