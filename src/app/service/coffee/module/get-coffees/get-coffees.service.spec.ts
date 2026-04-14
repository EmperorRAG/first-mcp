/**
 * Unit tests for the {@link GetCoffeesService}.
 *
 * @remarks
 * Runs the service inside an isolated Effect DI container backed by
 * {@link InMemoryCoffeeRepository}.  Validates that `execute` returns
 * all four seed coffees with the expected `name` and `price` properties.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { GetCoffeesService } from "./get-coffees.service.js";
import { InMemoryCoffeeRepository } from "../../repository/coffee-repository.js";

/**
 * Test-only {@link Layer} wiring {@link GetCoffeesService} to the
 * {@link InMemoryCoffeeRepository}.
 *
 * @internal
 */
const TestLayer = GetCoffeesService.Default.pipe(
	Layer.provide(InMemoryCoffeeRepository),
);

/**
 * Provides the {@link TestLayer} to an effect requiring
 * {@link GetCoffeesService} and runs it as a {@link Promise}.
 *
 * @typeParam A - Success value type.
 * @param effect - An effect that depends on {@link GetCoffeesService}.
 * @returns A promise resolving to the effect's success value.
 *
 * @internal
 */
const runWithService = <A>(
	effect: Effect.Effect<A, never, GetCoffeesService>,
) => Effect.runPromise(Effect.provide(effect, TestLayer));

describe("GetCoffeesService (Effect)", () => {
	it("execute returns all coffees from the repository", async () => {
		const coffees = await runWithService(
			Effect.gen(function* () {
				const service = yield* GetCoffeesService;
				return yield* service.execute;
			}),
		);
		expect(coffees).toHaveLength(4);
		expect(coffees[0]).toHaveProperty("name");
		expect(coffees[0]).toHaveProperty("price");
	});
});
