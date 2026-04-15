/**
 * Unit tests for the {@link GetCoffeesService}.
 *
 * @remarks
 * Runs the service inside an isolated Effect DI container via
 * {@link GetCoffeesService.Default} (which bundles
 * {@link CoffeeRepository.Default} internally).  Validates that
 * `execute` returns all four seed coffees with the expected `name`
 * and `price` properties.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { GetCoffeesService } from "./get-coffees.service.js";

/**
 * Provides {@link GetCoffeesService.Default} to an effect requiring
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
) => Effect.runPromise(Effect.provide(effect, GetCoffeesService.Default));

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
