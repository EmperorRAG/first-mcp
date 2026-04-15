/**
 * Unit tests for the {@link GetACoffeeService}.
 *
 * @remarks
 * Each test runs the service inside an isolated Effect DI container
 * via {@link GetACoffeeService.Default} (which bundles
 * {@link CoffeeRepository.Default} internally).  Validates:
 *
 * - **Happy path** — `execute` returns the correct `Coffee`
 *   when a matching name exists in the repository.
 * - **Not-found path** — `execute` fails with
 *   {@link CoffeeNotFoundError} whose `coffeeName` matches the input.
 * - **catchTag recovery** — the tagged error can be caught and
 *   mapped using `Effect.catchTag("CoffeeNotFoundError", …)`.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Cause, Effect, Exit, Schema } from "effect";
import { GetACoffeeService } from "./get-a-coffee.service.js";
import { CoffeeNotFoundError } from "../../errors.js";
import { CoffeeSchema } from "../../type/coffee/coffee.type.js";

/**
 * Provides {@link GetACoffeeService.Default} to an effect requiring
 * {@link GetACoffeeService}, producing a fully satisfied effect.
 *
 * @typeParam A - Success value type.
 * @typeParam E - Error channel type.
 * @param effect - An effect that depends on {@link GetACoffeeService}.
 * @returns The same effect with its service dependency fulfilled.
 *
 * @internal
 */
const runWithService = <A, E>(
	effect: Effect.Effect<A, E, GetACoffeeService>,
) => Effect.provide(effect, GetACoffeeService.Default);

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

	it("property: execute result for a known name decodes against CoffeeSchema", async () => {
		const knownNames = ["Flat White", "Cappuccino", "Latte", "Espresso"];
		const decode = Schema.decodeUnknownSync(CoffeeSchema);

		for (const name of knownNames) {
			const coffee = await Effect.runPromise(
				runWithService(
					Effect.gen(function* () {
						const service = yield* GetACoffeeService;
						return yield* service.execute(name);
					}),
				),
			);
			expect(() => decode(coffee)).not.toThrow();
			expect(coffee.name).toBe(name);
		}
	});
});
