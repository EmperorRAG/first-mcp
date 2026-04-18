/**
 * Application entry point — resolves transport mode from configuration
 * (with `--stdio` CLI override), composes the service layers, and starts
 * the MCP server via the {@link McpServerService}.
 *
 * @remarks
 * Orchestrates the full server lifecycle:
 *
 * 1. Reads {@link AppConfig.mode} from the environment, applying the
 *    `--stdio` CLI override via {@link resolveTransportMode}.
 * 2. Selects the appropriate {@link Transport} and {@link Router}
 *    layers based on the resolved mode.
 * 3. Composes {@link McpServerService.Default} (which bundles
 *    {@link CoffeeDomain} and its child services) with transport and
 *    config layers, then creates a {@link ManagedRuntime}.
 * 4. Resolves the {@link McpServerService} and calls
 *    {@link McpServerServiceShape.start | start()}.
 * 5. Registers SIGTERM / SIGINT handlers that interrupt the root
 *    {@link fiber}, triggering {@link Effect.scoped} finalizers.
 *
 * @module
 */
import { Effect, Fiber, Layer, ManagedRuntime } from "effect";
import { AppConfig } from "./config/app/app-config.js";
import { HttpTransportLive } from "./transport/http/http-transport.js";
import { StdioTransportLive } from "./transport/stdio/stdio.js";
import { HttpRouterLive } from "./router/http/http-router.js";
import { StdioRouterLive } from "./router/stdio/stdio-router.js";
import { McpServerService } from "./server/mcp/mcp-server.js";

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
 * MCP server.
 *
 * @remarks
 * Execution proceeds as follows:
 *
 * 1. Reads the configured transport mode and applies the `--stdio` CLI
 *    override via {@link resolveTransportMode}.
 * 2. Selects the transport, router, and MCP server layers by mode.
 * 3. Composes the full runtime layer and creates a
 *    {@link ManagedRuntime}.
 * 4. Resolves the {@link McpServerService} and calls
 *    {@link McpServerServiceShape.start | start()}.
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

	const transportLayer = mode === "stdio" ? StdioTransportLive : HttpTransportLive;
	const routerLayer = mode === "stdio" ? StdioRouterLive : HttpRouterLive;

	const depsLayer = Layer.mergeAll(AppConfig.Default, transportLayer, routerLayer);
	const mcpServerProvided = McpServerService.Default.pipe(
		Layer.provide(depsLayer),
	);
	const appLayer = Layer.mergeAll(
		AppConfig.Default,
		transportLayer,
		routerLayer,
		mcpServerProvided,
	);

	const runtime = ManagedRuntime.make(appLayer);

	yield* Effect.promise(() =>
		runtime.runPromise(
			Effect.gen(function* () {
				const svc = yield* McpServerService;
				yield* svc.start();
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
