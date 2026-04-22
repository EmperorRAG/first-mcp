/**
 * Unit tests for {@link getACoffee}.
 *
 * @remarks
 * Each test provides {@link InMemoryCoffeeRepositoryLive} via
 * {@link Effect.provide} and asserts the function returns the
 * MCP-shaped `{ content: [{ type: "text", text }] }` response.
 * Because {@link CoffeeNotFoundError} is caught internally via
 * {@link Effect.catchTag}, the function never fails — the not-found
 * case is asserted as a formatted message in the response text.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, Schema } from "effect";
import { getACoffee } from "./get-a-coffee.js";
import { InMemoryCoffeeRepositoryLive } from "../shared/repository/coffee/in-memory/repository.live.js";
import { CoffeeSchema } from "../shared/type/coffee/coffee.type.js";

describe("getACoffee", () => {
	/**
	 * Verifies the function returns the matching coffee for a known
	 * name in an MCP-shaped response.
	 */
	it("returns the matching coffee in an MCP-shaped response", async () => {
		/** @internal */
		const result = await Effect.runPromise(
			getACoffee({ name: "Flat White" }).pipe(
				Effect.provide(InMemoryCoffeeRepositoryLive),
			),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(parsed.name).toBe("Flat White");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(parsed.price).toBe(4.5);
	});

	/**
	 * Verifies the function returns a not-found message for an
	 * unknown name instead of failing the effect.
	 */
	it("returns a not-found message for an unknown name", async () => {
		/** @internal */
		const result = await Effect.runPromise(
			getACoffee({ name: "nonexistent" }).pipe(
				Effect.provide(InMemoryCoffeeRepositoryLive),
			),
		);
		expect(result.content[0]?.text).toBe(
			'Coffee "nonexistent" not found',
		);
	});

	/**
	 * Property test: every known name yields a coffee that decodes
	 * against {@link CoffeeSchema}.
	 */
	it("known names return coffees that decode against CoffeeSchema", async () => {
		/** @internal */
		const decode = Schema.decodeUnknownSync(CoffeeSchema);
		/** @internal */
		const knownNames = ["Flat White", "Cappuccino", "Latte", "Espresso"];

		for (const name of knownNames) {
			/** @internal */
			const result = await Effect.runPromise(
				getACoffee({ name }).pipe(
					Effect.provide(InMemoryCoffeeRepositoryLive),
				),
			);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const parsed = JSON.parse(result.content[0]?.text ?? "");
			expect(() => decode(parsed)).not.toThrow();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(parsed.name).toBe(name);
		}
	});
});
