/**
 * Unit tests for Effect-based `GetACoffeeService`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Cause, Effect, Exit, Layer } from "effect";
import { GetACoffeeService } from "./get-a-coffee.service.js";
import { CoffeeNotFoundError } from "../errors.js";
import { InMemoryCoffeeRepository } from "../repository/coffee-repository.js";

const TestLayer = GetACoffeeService.Default.pipe(
	Layer.provide(InMemoryCoffeeRepository),
);

const runWithService = <A, E>(
	effect: Effect.Effect<A, E, GetACoffeeService>,
) => Effect.provide(effect, TestLayer);

describe("GetACoffeeService (Effect)", () => {
	it("execute returns a coffee when found", async () => {
		const coffee = await Effect.runPromise(
			runWithService(
				Effect.gen(function* () {
					const service = yield* GetACoffeeService;
					return yield* service.execute("Flat White");
				}),
			),
		);
		expect(coffee.name).toBe("Flat White");
		expect(coffee.price).toBe(4.5);
	});

	it("execute fails with CoffeeNotFoundError when not found", async () => {
		const exit = await Effect.runPromiseExit(
			runWithService(
				Effect.gen(function* () {
					const service = yield* GetACoffeeService;
					return yield* service.execute("nonexistent");
				}),
			),
		);
		expect(Exit.isFailure(exit)).toBe(true);
		if (Exit.isFailure(exit)) {
			const failure = Cause.failureOption(exit.cause);
			expect(failure._tag).toBe("Some");
			if (failure._tag === "Some") {
				expect(failure.value).toBeInstanceOf(CoffeeNotFoundError);
				expect(failure.value.coffeeName).toBe("nonexistent");
			}
		}
	});

	it("CoffeeNotFoundError can be caught with catchTag", async () => {
		const result = await Effect.runPromise(
			runWithService(
				Effect.gen(function* () {
					const service = yield* GetACoffeeService;
					return yield* service.execute("nonexistent");
				}).pipe(
					Effect.catchTag("CoffeeNotFoundError", (err) =>
						Effect.succeed(`not found: ${err.coffeeName}`),
					),
				),
			),
		);
		expect(result).toBe("not found: nonexistent");
	});
});
