/**
 * Unit tests for {@link getCoffees}.
 *
 * @remarks
 * Each test provides {@link CoffeeRepository.Default} via
 * {@link Effect.provide} and asserts the function returns the
 * MCP-shaped `{ content: [{ type: "text", text }] }` response with
 * a JSON-serialised array of seed coffees.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect, Schema } from "effect";
import { getCoffees } from "./get-coffees.js";
import { CoffeeRepository } from "../shared/repository/coffee/repository.js";
import { CoffeeSchema } from "../shared/type/coffee/coffee.type.js";

describe("getCoffees", () => {
	/**
	 * Verifies the function returns all four seed coffees in an
	 * MCP-shaped response.
	 */
	it("returns all coffees as an MCP-shaped response", async () => {
		/** @internal */
		const result = await Effect.runPromise(
			getCoffees(undefined).pipe(
				Effect.provide(CoffeeRepository.Default),
			),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		expect(parsed).toHaveLength(4);
	});

	/**
	 * Property test: every coffee in the response decodes against
	 * {@link CoffeeSchema}.
	 */
	it("each returned coffee decodes against CoffeeSchema", async () => {
		/** @internal */
		const decode = Schema.decodeUnknownSync(CoffeeSchema);
		/** @internal */
		const result = await Effect.runPromise(
			getCoffees(undefined).pipe(
				Effect.provide(CoffeeRepository.Default),
			),
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed: unknown[] = JSON.parse(result.content[0]?.text ?? "");
		expect(parsed.length).toBeGreaterThan(0);
		for (const coffee of parsed) {
			expect(() => decode(coffee)).not.toThrow();
		}
	});
});
