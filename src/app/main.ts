/**
 * Application entry point — resolves transport mode from configuration
 * (with `--stdio` CLI override), composes the service layers, and
 * starts the MCP server via the {@link Listener} abstraction.
 *
 * @remarks
 * Orchestrates the full server lifecycle:
 *
 * 1. Reads {@link AppConfig.mode} from the environment, applying the
 *    `--stdio` CLI override via {@link resolveTransportMode}.
 * 2. Selects the appropriate {@link Transport}, {@link Router}, and
 *    {@link Listener} layers based on the resolved mode.
 * 3. Composes the full runtime layer and creates a
 *    {@link ManagedRuntime}.
 * 4. Resolves the {@link Listener} and calls
 *    {@link ListenerShape.start | start()}.
 * 5. Registers SIGTERM / SIGINT handlers that interrupt the root
 *    {@link fiber}, triggering {@link Effect.scoped} finalizers.
 *
 * @module
 */
import { Effect, Fiber, Layer, Logger, ManagedRuntime } from "effect";
import { AppConfig } from "./config/app/app-config.js";
import { HttpTransportLive } from "./transport/http/http-transport.js";
import { StdioTransportLive } from "./transport/stdio/stdio.js";
import { HttpRouterLive } from "./router/http/http-router.js";
import { StdioRouterLive } from "./router/stdio/stdio-router.js";
import { McpServerService } from "./server/mcp/mcp-server.js";
import { Listener } from "./server/server.js";
import { HttpListener, HttpListenerLive } from "./server/http/http-listener.js";
import { StdioListener, StdioListenerLive } from "./server/stdio/stdio-listener.js";

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
const resolveTransportMode = (configMode: "http" | "stdio"): "http" | "stdio" =>
	process.argv.includes("--stdio") ? "stdio" : configMode;

/**
 * Main application program that resolves the transport and starts the
 * MCP server via the {@link Listener} abstraction.
 *
 * @remarks
 * Execution proceeds as follows:
 *
 * 1. Reads the configured transport mode and applies the `--stdio` CLI
 *    override via {@link resolveTransportMode}.
 * 2. Selects the transport, router, and listener layers by mode.
 * 3. Composes the full runtime layer and creates a
 *    {@link ManagedRuntime}.
 * 4. Resolves the {@link Listener} and calls
 *    {@link ListenerShape.start | start()}.
 * 5. Registers a finalizer to dispose the {@link ManagedRuntime}.
 * 6. Suspends indefinitely with {@link Effect.never} so the server
 *    stays alive until interrupted.
 *
 * @internal
 */
const program = Effect.gen(function* () {
	const modeConfig = yield* Effect.promise(() =>
		Effect.runPromise(
			Effect.gen(function* () {
				const appConfig = yield* AppConfig;
				return appConfig.mode;
			}).pipe(Effect.provide(AppConfig.Default)),
		),
	);

	const mode = resolveTransportMode(modeConfig);

	// Ensure the environment reflects the resolved mode so that
	// downstream services (e.g. McpServerService) reading AppConfig
	// see the same value the layer graph was built with.
	process.env.TRANSPORT_MODE = mode;

	const transportLayer = mode === "stdio" ? StdioTransportLive : HttpTransportLive;
	const routerLayer = mode === "stdio"
		? StdioRouterLive
		: HttpRouterLive.pipe(Layer.provide(AppConfig.Default));

	const depsLayer = Layer.mergeAll(AppConfig.Default, transportLayer, routerLayer);
	const mcpServerProvided = McpServerService.Default.pipe(
		Layer.provide(depsLayer),
	);

	const listenerLayer = mode === "stdio"
		? Layer.effect(
			Listener,
			Effect.gen(function* () {
				const svc = yield* StdioListener;
				return svc;
			}),
		).pipe(
			Layer.provide(StdioListenerLive),
			Layer.provide(mcpServerProvided),
		)
		: Layer.effect(
			Listener,
			Effect.gen(function* () {
				const svc = yield* HttpListener;
				return svc;
			}),
		).pipe(
			Layer.provide(HttpListenerLive),
			Layer.provide(
				Layer.mergeAll(
					AppConfig.Default,
					transportLayer,
					routerLayer,
					mcpServerProvided,
				),
			),
		);

	const appLayer = Layer.mergeAll(
		AppConfig.Default,
		transportLayer,
		routerLayer,
		mcpServerProvided,
		listenerLayer,
	);

	// In stdio mode, redirect Effect logs to stderr so they do not
	// corrupt the JSON-RPC protocol channel on stdout.
	const stderrLoggerLayer = Logger.replace(
		Logger.defaultLogger,
		Logger.make(({ logLevel, message, date }) => {
			globalThis.process.stderr.write(
				`timestamp=${date.toISOString()} level=${logLevel.label} message=${String(message)}\n`,
			);
		}),
	);
	const finalLayer = mode === "stdio"
		? appLayer.pipe(Layer.provide(stderrLoggerLayer))
		: appLayer;

	const runtime = ManagedRuntime.make(finalLayer);

	yield* Effect.promise(() =>
		runtime.runPromise(
			Effect.gen(function* () {
				const listener = yield* Listener;
				yield* listener.start();
			}),
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
