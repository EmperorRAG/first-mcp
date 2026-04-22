/**
 * Unit tests for the {@link CoffeeDomain} Effect service.
 *
 * @remarks
 * Each test provides {@link CoffeeDomain.Default}, which bundles the
 * {@link CoffeeRepository} dependency.  Validates that the domain
 * composes correctly, exposes named registerable tool
 * properties with the expected `metaData`, and provides a
 * `registerCoffeeTools` method for batch tool registration.
 *
 * @module
 */
import { describe, it, expect, vi } from "vitest";
import { Effect, type ManagedRuntime } from "effect";
import type { McpServer } from "@modelcontextprotocol/server";
import { CoffeeDomain } from "./coffee.service.js";

/** @internal */
const runWithDomain = <A>(effect: Effect.Effect<A, never, CoffeeDomain>) =>
	Effect.runPromise(Effect.provide(effect, CoffeeDomain.Default));

describe("CoffeeDomain", () => {
	it("exposes getCoffees as a registerable tool", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.getCoffees.metaData.name).toBe("get-coffees");
		expect(domain.getCoffees.executeFormatted).toBeTypeOf("function");
	});

	it("exposes getACoffee as a registerable tool with inputSchema", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.getACoffee.metaData.name).toBe("get-a-coffee");
		expect(domain.getACoffee.inputSchema).toBeDefined();
		expect(domain.getACoffee.executeFormatted).toBeTypeOf("function");
	});

	it("getCoffees.executeFormatted returns MCP-shaped response", async () => {
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const domain = yield* CoffeeDomain;
				return yield* domain.getCoffees.executeFormatted(undefined);
			}).pipe(Effect.provide(CoffeeDomain.Default)),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		expect(parsed).toHaveLength(4);
	});

	it("getACoffee.executeFormatted returns MCP-shaped response", async () => {
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const domain = yield* CoffeeDomain;
				return yield* domain.getACoffee.executeFormatted({ name: "Espresso" });
			}).pipe(Effect.provide(CoffeeDomain.Default)),
		);
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe("text");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const parsed = JSON.parse(result.content[0]?.text ?? "");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(parsed.name).toBe("Espresso");
	});

	it("exposes registerCoffeeTools as a function", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);
		expect(domain.registerCoffeeTools).toBeTypeOf("function");
	});

	it("registerCoffeeTools registers active tools on the server", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);

		const registerTool = vi.fn();
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const mockServer = { registerTool } as unknown as McpServer;
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const mockRuntime = {} as unknown as ManagedRuntime.ManagedRuntime<CoffeeDomain, unknown>;

		domain.registerCoffeeTools(
			mockServer,
			{ "get-coffees": true, "get-a-coffee": true },
			mockRuntime,
		);

		expect(registerTool).toHaveBeenCalledTimes(2);
		expect(registerTool).toHaveBeenCalledWith(
			"get-coffees",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			expect.objectContaining({ description: expect.any(String) }),
			expect.any(Function),
		);
		expect(registerTool).toHaveBeenCalledWith(
			"get-a-coffee",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			expect.objectContaining({ description: expect.any(String) }),
			expect.any(Function),
		);
	});

	it("registerCoffeeTools skips inactive tools", async () => {
		const domain = await runWithDomain(
			Effect.gen(function* () {
				return yield* CoffeeDomain;
			}),
		);

		const registerTool = vi.fn();
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const mockServer = { registerTool } as unknown as McpServer;
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		const mockRuntime = {} as unknown as ManagedRuntime.ManagedRuntime<CoffeeDomain, unknown>;

		domain.registerCoffeeTools(
			mockServer,
			{ "get-coffees": true },
			mockRuntime,
		);

		expect(registerTool).toHaveBeenCalledTimes(1);
		expect(registerTool).toHaveBeenCalledWith(
			"get-coffees",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			expect.objectContaining({ description: expect.any(String) }),
			expect.any(Function),
		);
	});
});
