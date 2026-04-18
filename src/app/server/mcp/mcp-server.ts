/**
 * MCP server orchestration service — {@link Effect.Service} that
 * composes transport, router, configuration, and domain to start
 * the server in HTTP or stdio mode.
 *
 * @remarks
 * {@link McpServerService} is an {@link Effect.Service} whose `effect`
 * factory resolves {@link Transport}, {@link Router},
 * {@link AppConfig}, and {@link CoffeeDomain} from the dependency
 * graph.  It builds a shared {@link createMcpServer} closure and
 * delegates to mode-specific lifecycle modules:
 *
 * | Module | Responsibility |
 * |--------|---------------|
 * | {@link startHttp} | HTTP server, session map, request dispatch |
 * | {@link startStdio} | Single McpServer + StdioServerTransport |
 *
 * @module
 */
import { Effect, Layer, ManagedRuntime, Ref } from "effect";
import { AppConfig } from "../../config/app/app-config.js";
import { Transport } from "../../transport/transport.js";
import { Router } from "../../router/router.js";
import { CoffeeDomain } from "../../service/coffee/domain.js";
import { createMcpServer } from "./mcp-factory.js";
import type { McpServerServiceShape } from "./types.js";
import { type HttpServerHandle, startHttp } from "./http-lifecycle.js";
import { startStdio } from "./stdio-lifecycle.js";

export type { McpServerServiceShape } from "./types.js";

/**
 * Effect service orchestrating the MCP server lifecycle.
 *
 * @remarks
 * Resolves all required dependencies via Effect's DI:
 *
 * - {@link Transport} — request/response parsing
 * - {@link Router} — route matching and dispatch
 * - {@link AppConfig} — server identity, port, mode, active tools
 * - {@link CoffeeDomain} — domain tools for auto-registration
 *
 * The `dependencies` array bundles {@link CoffeeDomain.Default} so
 * that providing `McpServerService.Default` also satisfies the
 * domain's transitive dependencies.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { McpServerService } from "./mcp-server.js";
 *
 * const program = Effect.gen(function* () {
 *   const svc = yield* McpServerService;
 *   yield* svc.start();
 * });
 * ```
 */
export class McpServerService extends Effect.Service<McpServerService>()(
	"McpServerService",
	{
		scoped: Effect.gen(function* () {
			const transport = yield* Transport;
			const router = yield* Router;
			const config = yield* AppConfig;
			const domain = yield* CoffeeDomain;

			const handleRef = yield* Ref.make<HttpServerHandle | null>(null);

			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					const handle = yield* Ref.get(handleRef);
					if (handle) {
						yield* Effect.promise(() => handle.close());
						yield* Effect.logInfo("HTTP server closed");
					}
				}),
			);

			return {
				start: () =>
					Effect.gen(function* () {
						const appLayer = Layer.mergeAll(
							Layer.succeed(Transport, transport),
							Layer.succeed(Router, router),
							Layer.succeed(AppConfig, config),
							Layer.succeed(CoffeeDomain, domain),
						);
						const runtime = ManagedRuntime.make(appLayer);

						const mcpServerFactory = (
							rt: ManagedRuntime.ManagedRuntime<CoffeeDomain, unknown>,
						) => createMcpServer(config, domain, config.activeTools, rt);

						if (config.mode === "http") {
							const handle = yield* startHttp({
								port: config.port,
								transport,
								router,
								runtime,
								createMcpServerFn: mcpServerFactory,
							});
							yield* Ref.set(handleRef, handle);
						} else {
							yield* startStdio(runtime, mcpServerFactory);
						}
					}),
			} satisfies McpServerServiceShape;
		}),
		dependencies: [CoffeeDomain.Default],
	},
) { }