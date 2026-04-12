/**
 * Application entry point — resolves transport mode (`--stdio` or HTTP) and starts the server.
 *
 * @remarks
 * Uses a `ManagedRuntime` to manage the Effect service container.
 * Configuration is loaded via `AppConfig`, and graceful shutdown
 * disposes the runtime (running all finalizers) on SIGTERM and SIGINT.
 *
 * @module
 */
import { Effect, Layer, ManagedRuntime } from "effect";
import { McpServer } from "@modelcontextprotocol/server";
import { AppConfig } from "./config/app-config.js";
import {
	CoffeeDomainLive,
	registerCoffeeTools,
} from "./coffee/domain.js";
import { startHttpServer } from "./transport/http/http-transport.js";
import { startStdioServer } from "./transport/stdio/stdio.js";

const AppLive = Layer.mergeAll(AppConfig.Default, CoffeeDomainLive);

/**
 * Application entry point.
 *
 * @remarks
 * Selects the transport mode based on command-line arguments:
 * - `--stdio` flag: starts the stdio transport for local VS Code integration
 * - Default: starts the Streamable HTTP transport for network clients
 *
 * Creates a `ManagedRuntime` for the Effect service container and registers
 * SIGTERM/SIGINT handlers for graceful shutdown.
 */
async function main() {
	const runtime = ManagedRuntime.make(AppLive);

	const config = await runtime.runPromise(
		Effect.gen(function* () {
			const appConfig = yield* AppConfig;
			return {
				name: appConfig.name,
				version: appConfig.version,
				port: appConfig.port,
			};
		}),
	);

	const useStdio = process.argv.includes("--stdio");

	let httpCleanup: { close: () => Promise<void> } | undefined;

	const shutdown = async (): Promise<void> => {
		if (httpCleanup) {
			await httpCleanup.close();
		}
		await runtime.dispose();
		process.exit(0);
	};

	process.on("SIGTERM", () => void shutdown());
	process.on("SIGINT", () => void shutdown());

	if (useStdio) {
		const server = new McpServer({ name: config.name, version: config.version });
		registerCoffeeTools(server, runtime);
		await startStdioServer(server);
	} else {
		httpCleanup = startHttpServer(
			() => {
				const server = new McpServer({ name: config.name, version: config.version });
				registerCoffeeTools(server, runtime);
				return server;
			},
			config.port,
		);
	}
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
