import { defineConfig } from "vitest/config";
import { quickpickle } from "quickpickle";

export default defineConfig({
	plugins: [quickpickle()],
	test: {
		projects: [
			{
				test: {
					name: "unit",
					include: ["src/**/*.spec.ts"],
				},
			},
			{
				plugins: [quickpickle()],
				test: {
					name: "component",
					include: [
						"docs/features/**/components/**/*.feature",
					],
					setupFiles: [
						"src/app/coffee/shared/repository/coffee/step/coffee-repository.steps.ts",
						"src/app/config/mcp-server/step/mcp-server-config.steps.ts",
						"src/app/server/mcp-server/step/mcp-server-factory.steps.ts",
						"src/app/transport/http/step/http-transport.steps.ts",
						"src/app/transport/stdio/step/stdio-transport.steps.ts",
					],
				},
			},
			{
				plugins: [quickpickle()],
				test: {
					name: "service",
					include: [
						"docs/features/**/services/**/*.feature",
					],
					setupFiles: [
						"src/app/coffee/get-coffees/step/get-coffees.steps.ts",
						"src/app/coffee/get-a-coffee/step/get-a-coffee.steps.ts",
					],
				},
			},
			{
				plugins: [quickpickle()],
				test: {
					name: "domain",
					include: ["docs/features/coffee/*.feature"],
					setupFiles: [
						"src/app/coffee/step/coffee-domain.steps.ts",
					],
					testTimeout: 15000,
				},
			},
		],
	},
});
