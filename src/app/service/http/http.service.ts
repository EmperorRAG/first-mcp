/**
 * HTTP listener — {@link Effect.Service} that creates a `node:http`
 * server, dispatches requests through the per-RouteAction handlers
 * under {@link handle-request/}, and delegates session management to
 * {@link McpService}.
 *
 * @remarks
 * Composes the per-method effects in `start/`, `stop/`, `port/`, and
 * `address/` by providing them with the resolved {@link McpService},
 * {@link AppConfig}, and a freshly-allocated {@link ServerRefTag}
 * holding the bound `node:http` {@link import("node:http").Server}.
 *
 * @module
 */
import { Effect, Layer, Ref } from "effect";
import type { Server } from "node:http";
import { AppConfig } from "../../config/app/app-config.js";
import { McpService } from "../mcp/mcp.service.js";
import { address } from "./address/address.js";
import { port } from "./port/port.js";
import { ServerRefTag } from "./shared/type/server-ref/server-ref.tag.js";
import { start } from "./start/start.js";
import { stop } from "./stop/stop.js";

/**
 * Effect service managing the HTTP listener lifecycle.
 */
export class HttpService extends Effect.Service<HttpService>()(
	"HttpService",
	{
		scoped: Effect.gen(function* () {
			const mcpService = yield* McpService;
			const appConfig = yield* AppConfig;
			const serverRef = yield* Ref.make<Server | null>(null);

			const internalLayer = Layer.mergeAll(
				Layer.succeed(McpService, mcpService),
				Layer.succeed(AppConfig, appConfig),
				Layer.succeed(ServerRefTag, serverRef),
			);

			return {
				start: () => start().pipe(Effect.provide(internalLayer)),
				stop: () => stop().pipe(Effect.provide(internalLayer)),
				port: () => port().pipe(Effect.provide(internalLayer)),
				address: () => address().pipe(Effect.provide(internalLayer)),
			};
		}),
		dependencies: [McpService.Default],
	},
) { }
