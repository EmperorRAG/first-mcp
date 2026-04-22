/**
 * Hierarchical layer composition following the
 * BaseLayer / FeatureModule / AppLayer pattern.
 *
 * @remarks
 * Exports two self-contained application layers — one per transport
 * mode — so that {@link module:main | main.ts} can select the
 * correct graph at startup without any inline layer wiring.
 *
 * | Tier | Contents |
 * |------|----------|
 * | **BaseLayer** | {@link AppConfig} (infrastructure config) |
 * | **InfraLayer** | Transport + Router (mode-specific) |
 * | **McpServerModule** | {@link McpServerService} (session CRUD, tool registration) |
 * | **ListenerModule** | {@link Listener} (mode-specific lifecycle) |
 * | **AppLayer** | All tiers composed into a single self-contained layer |
 *
 * @module
 */
import { Layer, Logger } from "effect";
import { AppConfig } from "./config/app/app-config.js";
import { HttpTransportLive } from "./transport/http/http-transport.js";
import { StdioTransportLive } from "./transport/stdio/stdio.js";
import { HttpRouterLive } from "./router/http/http-router.js";
import { StdioRouterLive } from "./router/stdio/stdio-router.js";
import { McpServerService } from "./server/mcp/mcp-server.js";
import { Listener } from "./server/server.js";
import { HttpListener, HttpListenerLive } from "./server/http/http-listener.js";
import { StdioListener, StdioListenerLive } from "./server/stdio/stdio-listener.js";

// ── BaseLayer ────────────────────────────────────────────────────
// Application-wide infrastructure shared by both transport modes.

const BaseLayer = AppConfig.Default;

// ── InfraLayers (mode-specific) ──────────────────────────────────
// Transport + Router implementations selected per mode.

const StdioInfraLayer = Layer.mergeAll(StdioTransportLive, StdioRouterLive);

const HttpInfraLayer = Layer.mergeAll(
	HttpTransportLive,
	HttpRouterLive.pipe(Layer.provide(BaseLayer)),
);

// ── McpServerModule ──────────────────────────────────────────────
// Session manager + domain tools. CoffeeDomain.Default is bundled
// internally via McpServerService's `dependencies` array.

const McpServerModule = McpServerService.Default.pipe(
	Layer.provide(BaseLayer),
);

// ── ListenerModules (mode-specific) ──────────────────────────────
// Each resolves the polymorphic Listener tag to its concrete impl.

const StdioListenerModule = Layer.effect(Listener, StdioListener).pipe(
	Layer.provide(StdioListenerLive),
	Layer.provide(McpServerModule),
);

const HttpListenerModule = Layer.effect(Listener, HttpListener).pipe(
	Layer.provide(HttpListenerLive),
	Layer.provide(
		Layer.mergeAll(BaseLayer, HttpInfraLayer, McpServerModule),
	),
);

// ── Stderr logger (stdio only) ───────────────────────────────────
// Redirects Effect logs to stderr so they do not corrupt the
// JSON-RPC protocol channel on stdout.

const stderrLoggerLayer = Logger.replace(
	Logger.defaultLogger,
	Logger.make(({ logLevel, message, date }) => {
		globalThis.process.stderr.write(
			`timestamp=${date.toISOString()} level=${logLevel.label} message=${String(message)}\n`,
		);
	}),
);

// ── AppLayers ────────────────────────────────────────────────────
// Self-contained layer graphs — one per transport mode.

/**
 * Complete layer graph for stdio transport mode.
 *
 * @remarks
 * Includes the stderr logger override so that Effect log output
 * does not corrupt the JSON-RPC channel on stdout.
 */
export const StdioAppLayer = Layer.mergeAll(
	BaseLayer,
	StdioInfraLayer,
	McpServerModule,
	StdioListenerModule,
).pipe(Layer.provide(stderrLoggerLayer));

/**
 * Complete layer graph for HTTP transport mode.
 */
export const HttpAppLayer = Layer.mergeAll(
	BaseLayer,
	HttpInfraLayer,
	McpServerModule,
	HttpListenerModule,
);
