/**
 * Application entry point — resolves transport mode (`--stdio` or HTTP)
 * and starts the MCP server.
 *
 * @remarks
 * Orchestrates the full server lifecycle:
 *
 * 1. Composes the {@link AppLive} layer from {@link AppConfig} and
 *    {@link CoffeeDomainLive}.
 * 2. Creates a {@link ManagedRuntime} so Effect services are available
 *    inside MCP tool handlers.
 * 3. Selects the transport based on `process.argv`:
 *    - `--stdio` → {@link startStdioServer} (local VS Code integration)
 *    - default  → {@link startHttpServer} (Streamable HTTP for
 *      network / Docker clients)
 * 4. Registers SIGTERM / SIGINT handlers that interrupt the root
 *    {@link fiber}, triggering {@link Effect.scoped} finalizers
 *    (HTTP close, runtime dispose).
 *
 * @module
 */
import { Effect, Fiber, Layer, ManagedRuntime } from "effect";
import { McpServer } from "@modelcontextprotocol/server";
import { AppConfig } from "./config/app/app-config.js";
import {
	CoffeeDomainLive,
	registerCoffeeTools,
} from "./service/coffee/domain.js";
import { startHttpServer } from "./transport/http/http-transport.js";
import { startStdioServer } from "./transport/stdio/stdio.js";

/**
 * Top-level application {@link Layer} composing all required services.
 *
 * @remarks
 * Merges {@link AppConfig.Default} (configuration) with
 * {@link CoffeeDomainLive} (repository + coffee services) into a
 * single layer that is provided to the {@link ManagedRuntime}.
 *
 * @internal
 */
const AppLive = Layer.mergeAll(AppConfig.Default, CoffeeDomainLive);

/**
 * Main application program that selects and starts a transport.
 *
 * @remarks
 * Execution proceeds as follows:
 *
 * 1. Creates a {@link ManagedRuntime} from {@link AppLive}, which
 *    provides {@link AppConfig} and all coffee domain services.
 * 2. Reads `name`, `version`, and `port` from the resolved config.
 * 3. Checks `process.argv` for the `--stdio` flag:
 *    - **Stdio mode** — creates a single {@link McpServer}, registers
 *      coffee tools, and starts {@link startStdioServer}.
 *    - **HTTP mode** — passes a factory function to
 *      {@link startHttpServer} that creates a fresh
 *      {@link McpServer} per session.  Registers an
 *      {@link Effect.addFinalizer | finalizer} to close the HTTP
 *      server on shutdown.
 * 4. Registers a finalizer to dispose the {@link ManagedRuntime}
 *    (releasing all service resources).
 * 5. Suspends indefinitely with {@link Effect.never} so the server
 *    stays alive until interrupted.
 *
 * @internal
 */
const program = Effect.gen(function* () {
	const runtime = ManagedRuntime.make(AppLive);

	const config = yield* Effect.promise(() =>
		runtime.runPromise(
			Effect.gen(function* () {
				const appConfig = yield* AppConfig;
				return {
					name: appConfig.name,
					version: appConfig.version,
					port: appConfig.port,
				};
			}),
		),
	);

	const useStdio = process.argv.includes("--stdio");

	if (useStdio) {
		const server = new McpServer({ name: config.name, version: config.version });
		registerCoffeeTools(server, runtime);
		yield* startStdioServer(server);
	} else {
		const handle = yield* startHttpServer(
			() => {
				const server = new McpServer({ name: config.name, version: config.version });
				registerCoffeeTools(server, runtime);
				return server;
			},
			config.port,
		);

		yield* Effect.addFinalizer(() =>
			Effect.promise(() => handle.close()).pipe(
				Effect.andThen(Effect.logInfo("HTTP server closed")),
			),
		);
	}

	yield* Effect.addFinalizer(() =>
		Effect.promise(() => runtime.dispose()).pipe(
			Effect.andThen(Effect.logInfo("Runtime disposed")),
		),
	);

	yield* Effect.never;
});

/**
 * Root fiber executing the scoped {@link program}.
 *
 * @remarks
 * {@link Effect.runFork} starts `program` on its own fiber.
 * {@link Effect.scoped} ensures all finalizers (HTTP close,
 * runtime dispose) run when the fiber is interrupted.
 * The {@link shutdown} handler interrupts this fiber on
 * SIGTERM / SIGINT.
 *
 * @internal
 */
const fiber = Effect.runFork(program.pipe(Effect.scoped));

/**
 * Interrupts the root {@link fiber} to trigger graceful shutdown.
 *
 * @remarks
 * Registered as the handler for both `SIGTERM` and `SIGINT`.
 * Interrupting the fiber causes {@link Effect.scoped} to run all
 * finalizers (HTTP server close, {@link ManagedRuntime} disposal)
 * before the process exits.
 *
 * @internal
 */
const shutdown = () => {
	Effect.runFork(Fiber.interrupt(fiber));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
