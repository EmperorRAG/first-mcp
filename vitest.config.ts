import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "unit",
					include: ["src/**/*.spec.ts"],
					exclude: ["src/app/main.spec.ts"],
				},
			},
			{
				test: {
					name: "e2e",
					include: ["src/app/main.spec.ts"],
					testTimeout: 30_000,
					hookTimeout: 30_000,
				},
			},
		],
	},
});
