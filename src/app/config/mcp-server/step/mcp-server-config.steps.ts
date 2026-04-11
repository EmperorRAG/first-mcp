import { Given, When, Then, After } from "quickpickle";
import { expect } from "vitest";
import {
	SERVER_NAME,
	SERVER_VERSION,
	DEFAULT_PORT,
	getPort,
} from "../mcp-server.config.js";

declare module "quickpickle" {
	interface QuickPickleWorldInterface {
		port: number;
	}
}

After(() => {
	delete process.env.PORT;
});

// Unit steps

Given("the server config is loaded", () => {
	// Module is imported at top level — no action needed
});

Then("SERVER_NAME should be {string}", (_world, expected: string) => {
	expect(SERVER_NAME).toBe(expected);
});

Then("SERVER_VERSION should be {string}", (_world, expected: string) => {
	expect(SERVER_VERSION).toBe(expected);
});

Then("DEFAULT_PORT should be {int}", (_world, expected: number) => {
	expect(DEFAULT_PORT).toBe(expected);
});

Given("the PORT environment variable is not set", () => {
	delete process.env.PORT;
});

Given(
	"the PORT environment variable is set to {string}",
	(_world, value: string) => {
		process.env.PORT = value;
	},
);

When("I call getPort", (world) => {
	world.port = getPort();
});

Then("the port should be {int}", (world, expected: number) => {
	expect(world.port).toBe(expected);
});

// Contract steps

Then("SERVER_NAME should be a non-empty string", () => {
	expect(typeof SERVER_NAME).toBe("string");
	expect(SERVER_NAME.length).toBeGreaterThan(0);
});

Then("SERVER_VERSION should match semver format", () => {
	expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
});

Then(
	"DEFAULT_PORT should be a number between {int} and {int}",
	(_world, min: number, max: number) => {
		expect(typeof DEFAULT_PORT).toBe("number");
		expect(DEFAULT_PORT).toBeGreaterThanOrEqual(min);
		expect(DEFAULT_PORT).toBeLessThanOrEqual(max);
	},
);

Then("the port should be a number", (world) => {
	expect(typeof world.port).toBe("number");
});
