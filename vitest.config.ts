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
						"src/app/coffee/shared/repository/step/coffee-repository.steps.ts",
						"src/config/server/step/server-config.steps.ts",
						"src/server/step/server-factory.steps.ts",
						"src/transport/stdio/step/stdio-transport.steps.ts",
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
						"src/transport/http/step/http-transport.steps.ts",
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
