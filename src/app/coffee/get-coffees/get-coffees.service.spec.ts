/**
 * Unit tests for Effect-based `GetCoffeesService`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { GetCoffeesService } from "./get-coffees.service.js";
import { InMemoryCoffeeRepository } from "../repository/coffee-repository.js";

const TestLayer = GetCoffeesService.Default.pipe(
	Layer.provide(InMemoryCoffeeRepository),
);

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
