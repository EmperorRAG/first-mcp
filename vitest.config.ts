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
						"src/app/coffee/shared/repository/coffee/step/coffee-repository.shared.steps.ts",
						"src/app/coffee/shared/repository/coffee/step/coffee-repository.unit.steps.ts",
						"src/app/coffee/shared/repository/coffee/step/coffee-repository.integration.steps.ts",
						"src/app/coffee/shared/repository/coffee/step/coffee-repository.contract.steps.ts",
						"src/app/config/mcp-server/step/mcp-server-config.shared.steps.ts",
						"src/app/config/mcp-server/step/mcp-server-config.unit.steps.ts",
						"src/app/config/mcp-server/step/mcp-server-config.contract.steps.ts",
						"src/app/server/mcp-server/step/mcp-server-factory.shared.steps.ts",
						"src/app/server/mcp-server/step/mcp-server-factory.unit.steps.ts",
						"src/app/server/mcp-server/step/mcp-server-factory.contract.steps.ts",
						"src/app/transport/http/step/http-transport.shared.steps.ts",
						"src/app/transport/http/step/http-transport.contract.steps.ts",
						"src/app/transport/stdio/step/stdio-transport.unit.steps.ts",
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
						"src/app/coffee/get-coffees/step/get-coffees.shared.steps.ts",
						"src/app/coffee/get-coffees/step/get-coffees.integration.steps.ts",
						"src/app/coffee/get-coffees/step/get-coffees.contract.steps.ts",
						"src/app/coffee/get-a-coffee/step/get-a-coffee.shared.steps.ts",
						"src/app/coffee/get-a-coffee/step/get-a-coffee.integration.steps.ts",
						"src/app/coffee/get-a-coffee/step/get-a-coffee.contract.steps.ts",
					],
				},
			},
			{
				plugins: [quickpickle()],
				test: {
					name: "domain",
					include: ["docs/features/coffee/*.feature"],
					setupFiles: [
						"src/app/coffee/step/coffee-domain.shared.steps.ts",
						"src/app/coffee/step/coffee-domain.integration.steps.ts",
						"src/app/coffee/step/coffee-domain.contract.steps.ts",
						"src/app/coffee/step/coffee-domain.e2e.steps.ts",
					],
					testTimeout: 15000,
				},
			},
		],
	},
});
