/**
 * Unit tests for Effect-based coffee domain layer composition.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, ManagedRuntime } from "effect";
import { CoffeeDomainLive } from "./domain.js";
import { GetCoffeesService } from "./get-coffees/get-coffees.service.js";
import { GetACoffeeService } from "./get-a-coffee/get-a-coffee.service.js";

describe("CoffeeDomainLive", () => {
	it("provides GetCoffeesService", async () => {
		const runtime = ManagedRuntime.make(CoffeeDomainLive);
		const coffees = await runtime.runPromise(
			Effect.gen(function* () {
				const service = yield* GetCoffeesService;
				return yield* service.execute;
			}),
		);
		expect(coffees).toHaveLength(4);
		await runtime.dispose();
	});

	it("provides GetACoffeeService", async () => {
		const runtime = ManagedRuntime.make(CoffeeDomainLive);
		const coffee = await runtime.runPromise(
			Effect.gen(function* () {
				const service = yield* GetACoffeeService;
				return yield* service.execute("Cappuccino");
			}),
		);
		expect(coffee).toBeDefined();
		expect(coffee!.name).toBe("Cappuccino");
		await runtime.dispose();
	});
});
