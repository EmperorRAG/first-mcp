/**
 * MCP server orchestration service — Layer factory that composes
 * transport, router, and configuration to start the server in HTTP
 * or stdio mode.
 *
 * @remarks
 * The {@link McpServerServiceLive} factory is the central wiring point.
 * It resolves {@link Transport}, {@link Router}, and {@link AppConfig}
 * from the Effect layer, builds a shared {@link createMcpServer}
 * factory, and delegates to mode-specific lifecycle modules:
 *
 * | Module | Responsibility |
 * |--------|---------------|
 * | {@link startHttp} | HTTP server, session map, request dispatch |
 * | {@link startStdio} | Single McpServer + StdioServerTransport |
 *
 * Types ({@link McpServerService}, {@link McpServerServiceShape},
 * {@link ToolRegistrationFn}) are defined in `./types.ts` and
 * re-exported here to preserve existing import paths.
 *
 * @module
 */
import { McpServer } from "@modelcontextprotocol/server";
import { Effect, Layer, ManagedRuntime, Ref } from "effect";
import { AppConfig } from "../../config/app/app-config.js";
import { Transport } from "../../transport/transport.js";
import { Router } from "../../router/router.js";
import {
	McpServerService,
	type McpServerServiceShape,
	type ToolRegistrationFn,
} from "./types.js";
import { type HttpServerHandle, startHttp } from "./http-lifecycle.js";
import { startStdio } from "./stdio-lifecycle.js";

export {
	McpServerService,
	type McpServerServiceShape,
	type ToolRegistrationFn,
} from "./types.js";

/**
 * Creates the {@link McpServerServiceLive} layer parameterised by a
 * tool registration callback.
 *
 * @remarks
 * This factory function produces a {@link Layer.scoped} layer that
 * resolves {@link Transport}, {@link Router}, and {@link AppConfig}
 * from the dependency graph.  Depending on `config.mode`:
 *
 * - **HTTP**: delegates to {@link startHttp} which spins up a
 *   `node:http` server with per-request parse→route→dispatch loop
 *   and session management.  Registers a finalizer for graceful
 *   shutdown.
 * - **stdio**: delegates to {@link startStdio} which creates a
 *   single {@link McpServer} + `StdioServerTransport` and connects
 *   them.
 *
 * @param registerTools - Callback invoked once per {@link McpServer}
 *        creation to register domain tools.
 * @returns A {@link Layer} satisfying the {@link McpServerService} tag.
 */
export const McpServerServiceLive = (
	registerTools: ToolRegistrationFn,
): Layer.Layer<McpServerService, never, Transport | Router | AppConfig> =>
	Layer.scoped(
		McpServerService,
		Effect.gen(function* () {
			const transport = yield* Transport;
			const router = yield* Router;
			const config = yield* AppConfig;

			/**
			 * Creates a new {@link McpServer}, registers tools on it,
			 * and returns it.
			 *
			 * @remarks
			 * Shared by both HTTP and stdio modes.  In HTTP mode this is
			 * called once per session; in stdio mode it is called once at
			 * startup.
			 *
			 * @internal
			 */
			const createMcpServer = (
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
			): McpServer => {
				const server = new McpServer({
					name: config.name,
					version: config.version,
				});
				registerTools(server, runtime);
				return server;
			};

			// --- Service implementation ---

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
						// Build a layer with all the services the MCP server needs
						const appLayer = Layer.mergeAll(
							Layer.succeed(Transport, transport),
							Layer.succeed(Router, router),
							Layer.succeed(AppConfig, config),
						);
						const runtime = ManagedRuntime.make(appLayer);

						if (config.mode === "http") {
							const handle = yield* startHttp({
								port: config.port,
								transport,
								router,
								runtime,
								createMcpServerFn: createMcpServer,
							});
							yield* Ref.set(handleRef, handle);
						} else {
							yield* startStdio(runtime, createMcpServer);
						}
					}),
			} satisfies McpServerServiceShape;
		}),
	);