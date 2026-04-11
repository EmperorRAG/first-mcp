import { vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/server";
import type { Coffee } from "../../coffee/shared/type/coffee.types.js";
import type { CoffeeRepository } from "../../coffee/shared/repository/coffee/coffee.repository.js";
import type { GetCoffeesServiceClass } from "../../coffee/get-coffees/service/get-coffees.service.js";
import type { GetACoffeeServiceClass } from "../../coffee/get-a-coffee/service/get-a-coffee.service.js";
import type { GetCoffeesControllerClass } from "../../coffee/get-coffees/controller/get-coffees.controller.js";
import type { GetACoffeeControllerClass } from "../../coffee/get-a-coffee/controller/get-a-coffee.controller.js";
import { defaultCoffeeList, flatWhiteCoffee } from "./coffee.factory.js";
import { createToolTextResponse } from "../utility/tool-response.utility.js";
import { isFunctionValue } from "../utility/reflect.utility.js";

export function createMockCoffeeRepository(
	coffees: Coffee[] = defaultCoffeeList,
): CoffeeRepository {
	return {
		findAll: vi.fn(() => coffees),
		findByName: vi.fn((name: string) =>
			coffees.find((coffee) => coffee.name === name),
		),
	};
}

export function createMockGetCoffeesService(
	coffees: Coffee[] = defaultCoffeeList,
): GetCoffeesServiceClass {
	return {
		execute: vi.fn(() => coffees),
	};
}

export function createMockGetACoffeeService(
	coffee: Coffee | undefined = flatWhiteCoffee,
): GetACoffeeServiceClass {
	return {
		execute: vi.fn((name: string) =>
			name === flatWhiteCoffee.name ? coffee : undefined,
		),
	};
}

export function createMockGetCoffeesController(
	text = "[]",
): GetCoffeesControllerClass {
	const response = createToolTextResponse(text);
	return {
		handle: vi.fn(() => response),
	};
}

export function createMockGetACoffeeController(
	text = "{}",
): GetACoffeeControllerClass {
	const response = createToolTextResponse(text);
	return {
		handle: vi.fn(() => response),
	};
}

export function captureRegisterToolHandler(server: McpServer): {
	getCallCount: () => number;
	getRegisteredToolName: () => string;
	getRegisteredToolConfig: () => unknown;
	getHandler: () => (...args: unknown[]) => unknown;
} {
	const originalRegisterTool = server.registerTool.bind(server);
	let callCount = 0;
	let registeredToolName: string | undefined;
	let registeredToolConfig: unknown;
	let capturedHandler: unknown;

	vi.spyOn(server, "registerTool").mockImplementation(
		(name, config, callback) => {
			callCount += 1;
			registeredToolName = name;
			registeredToolConfig = config;
			capturedHandler = callback;
			return originalRegisterTool(name, config, callback);
		},
	);

	return {
		getCallCount: () => callCount,
		getRegisteredToolName: () => {
			if (!registeredToolName) {
				throw new Error("Expected registerTool to be called with a tool name");
			}
			return registeredToolName;
		},
		getRegisteredToolConfig: () => registeredToolConfig,
		getHandler: () => {
			if (!isFunctionValue(capturedHandler)) {
				throw new Error("Expected registerTool callback to be a function");
			}
			return capturedHandler;
		},
	};
}