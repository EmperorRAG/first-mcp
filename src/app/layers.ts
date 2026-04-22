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
 * | **McpServerModule** | {@link McpService} (session CRUD, tool registration) |
 * | **ServiceModule** | {@link HttpService} or {@link StdioService} (mode-specific lifecycle) |
 * | **AppLayer** | All tiers composed into a single self-contained layer |
 *
 * @module
 */
import { Layer, Logger } from "effect";
import { AppConfig } from "./config/app/app-config.js";
import { McpService } from "./service/mcp/mcp.service.js";
import { HttpService } from "./service/http/http.service.js";
import { StdioService } from "./service/stdio/stdio.service.js";

const BaseLayer = AppConfig.Default;

const McpServerModule = McpService.Default.pipe(
	Layer.provide(BaseLayer),
);

const StdioServiceModule = StdioService.Default.pipe(
	Layer.provide(McpServerModule),
	Layer.provide(BaseLayer),
);

const HttpServiceModule = HttpService.Default.pipe(
	Layer.provide(McpServerModule),
	Layer.provide(BaseLayer),
);

const stderrLoggerLayer = Logger.replace(
	Logger.defaultLogger,
	Logger.make(({ logLevel, message, date }) => {
		globalThis.process.stderr.write(
			`timestamp=${date.toISOString()} level=${logLevel.label} message=${String(message)}\n`,
		);
	}),
);

/**
 * Complete layer graph for stdio transport mode.
 */
export const StdioAppLayer = Layer.mergeAll(
	BaseLayer,
	McpServerModule,
	StdioServiceModule,
).pipe(Layer.provide(stderrLoggerLayer));

/**
 * Complete layer graph for HTTP transport mode.
 */
export const HttpAppLayer = Layer.mergeAll(
	BaseLayer,
	McpServerModule,
	HttpServiceModule,
);