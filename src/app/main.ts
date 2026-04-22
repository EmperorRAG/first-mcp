/**
 * Application entry point — resolves transport mode from configuration
 * (with `--stdio` CLI override), selects the appropriate
 * {@link StdioAppLayer} or {@link HttpAppLayer}, and starts the MCP
 * server via the {@link Listener} abstraction.
 *
 * @remarks
 * Orchestrates the full server lifecycle:
 *
 * 1. Reads {@link AppConfig.mode} from the environment, applying the
 *    `--stdio` CLI override via {@link resolveTransportMode}.
 * 2. Selects the pre-composed {@link StdioAppLayer} or
 *    {@link HttpAppLayer} from {@link module:layers | layers.ts}.
 * 3. Creates a {@link ManagedRuntime} from the selected layer.
 * 4. Resolves the {@link Listener} and calls
 *    {@link ListenerShape.start | start()}.
 * 5. Registers SIGTERM / SIGINT handlers that interrupt the root
 *    {@link fiber}, triggering {@link Effect.scoped} finalizers.
 *
 * @module
 */
import { Effect, Fiber, ManagedRuntime } from "effect";
import { AppConfig } from "./config/app/app-config.js";
import { Listener } from "./server/server.js";
import { StdioAppLayer, HttpAppLayer } from "./layers.js";

/**
 * Resolves the effective transport mode by checking the `--stdio` CLI
 * flag first, then falling back to the `TRANSPORT_MODE` config value.
 *
 * @remarks
 * The `--stdio` flag takes precedence over the environment variable so
 * that `.vscode/mcp.json` launch configurations continue to work without
 * requiring `TRANSPORT_MODE=stdio` in the environment.
 *
 * @param configMode - The transport mode read from {@link AppConfig}.
 * @returns `"stdio"` when the CLI flag is present; otherwise `configMode`.
 *
 * @internal
 */
const resolveTransportMode = (configMode: "http" | "stdio") =>
	Effect.if(process.argv.includes("--stdio"), {
		onTrue: () => Effect.succeed("stdio" as const),
		onFalse: () => Effect.succeed(configMode),
	});

/**
 * Main application program that resolves the transport mode and starts
 * the MCP server via the {@link Listener} abstraction.
 *
 * @remarks
 * Execution proceeds as follows:
 *
 * 1. Reads the configured transport mode and applies the `--stdio` CLI
 *    override via {@link resolveTransportMode}.
 * 2. Selects the pre-composed {@link StdioAppLayer} or
 *    {@link HttpAppLayer}.
 * 3. Creates a {@link ManagedRuntime} from the selected layer.
 * 4. Resolves the {@link Listener} and calls
 *    {@link ListenerShape.start | start()}.
 * 5. Registers a finalizer to dispose the {@link ManagedRuntime}.
 * 6. Suspends indefinitely with {@link Effect.never} so the server
 *    stays alive until interrupted.
 *
 * @internal
 */
const program = Effect.gen(function* () {
	const modeConfig = yield* AppConfig.pipe(
		Effect.map((c) => c.mode),
		Effect.provide(AppConfig.Default),
	);

	const mode = yield* resolveTransportMode(modeConfig);

	// Ensure the environment reflects the resolved mode so that
	// downstream services (e.g. McpServerService) reading AppConfig
	// see the same value the layer graph was built with.
	yield* Effect.sync(() => { process.env.TRANSPORT_MODE = mode; });

	const appLayer = yield* Effect.if(mode === "stdio", {
		onTrue: () => Effect.succeed(StdioAppLayer),
		onFalse: () => Effect.succeed(HttpAppLayer),
	});

	const runtime = ManagedRuntime.make(appLayer);

	yield* Effect.promise(() =>
		runtime.runPromise(
			Listener.pipe(Effect.flatMap((l) => l.start())),
		),
	);

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
