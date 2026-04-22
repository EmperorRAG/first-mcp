/**
 * Unit tests for the {@link CoffeeService} Effect service.
 *
 * @remarks
 * Each test provides {@link CoffeeService.Default}, which bundles the
 * {@link RepositoryTag} dependency.  Validates that the service
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
import { CoffeeService } from "./coffee.service.js";

/**
 * Helper that runs an Effect with the {@link CoffeeService.Default}
 * layer providing both the service and its underlying
 * {@link RepositoryTag}.
 *
 * @internal
 */
const runWithService = <A>(effect: Effect.Effect<A, never, CoffeeService>) =>
	Effect.runPromise(Effect.provide(effect, CoffeeService.Default));

describe("CoffeeService", () => {
	it("exposes getCoffees as an executor function", async () => {
		/** @internal */
		const service = await runWithService(
			Effect.gen(function* () {
				return yield* CoffeeService;
			}),
		);
		expect(service.getCoffees).toBeTypeOf("function");
	});

	it("exposes getACoffee as an executor function", async () => {
		/** @internal */
		const service = await runWithService(
			Effect.gen(function* () {
				return yield* CoffeeService;
			}),
		);
		expect(service.getACoffee).toBeTypeOf("function");
	});

	it("getCoffees returns MCP-shaped response", async () => {
		/** @internal */
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const service = yield* CoffeeService;
				return yield* service.getCoffees(undefined);
			}).pipe(Effect.provide(CoffeeService.Default)),
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
				const service = yield* CoffeeService;
				return yield* service.getACoffee({ name: "Espresso" });
			}).pipe(Effect.provide(CoffeeService.Default)),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(parsed.name).toBe("Espresso");
	});
});