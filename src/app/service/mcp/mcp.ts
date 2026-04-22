/**
 * MCP server session manager — {@link Effect.Service} that owns
 * the lifecycle of all MCP sessions: creation, lookup, deletion,
 * and batch teardown.
 *
 * @remarks
 * {@link McpService} is an {@link Effect.Service} whose
 * `scoped` factory resolves {@link AppConfig} and
 * {@link CoffeeDomain}, creates a {@link ManagedRuntime} for tool
 * handler execution, and exposes CRUD operations over the internal
 * session map ({@link Ref}).
 *
 * Transport and routing are **not** dependencies of this service.
 * Those concerns are delegated to the listener services
 * (`HttpListener`, `StdioListener`) that depend on
 * `McpServerService`.
 *
 * @module
 */
import { randomUUID } from "node:crypto";
import { Effect, Layer, ManagedRuntime, Ref } from "effect";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { StdioServerTransport } from "@modelcontextprotocol/server";
import { AppConfig } from "../../config/app/app-config.js";
import { CoffeeDomain } from "../coffee/domain.js";
import type { McpServiceInterface, SessionEntry } from "./types.js";
import { SessionNotFoundError } from "./shared/error/session-not-found/session-not-found.js";

export type { McpServiceInterface as McpServerServiceShape, SessionEntry } from "./types.js";
export { SessionNotFoundError } from "./shared/error/session-not-found/session-not-found.js";

/**
 * Effect service managing MCP server sessions.
 *
 * @remarks
 * Resolves the following dependencies via Effect's DI:
 *
 * - {@link AppConfig} — server identity, mode, active tools
 * - {@link CoffeeDomain} — domain tools for auto-registration
 *
 * The `dependencies` array bundles {@link CoffeeDomain.Default} so
 * that providing `McpServerService.Default` also satisfies the
 * domain's transitive dependencies.
 *
 * Session CRUD:
 *
 * | Method | Behaviour |
 * |--------|-----------|
 * | {@link start} | No-op (runtime initialised in `scoped`) |
 * | {@link stop} | Closes all SDK transports, clears map |
	 * | {@link getSession} | Returns session or fails with {@link SessionNotFoundError} |
 * | {@link setSession} | Creates McpServer + sdkTransport, registers tools, connects, stores, returns entry |
 * | {@link deleteSession} | Closes SDK transport, removes entry |
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { McpServerService } from "./mcp-server.js";
 *
 * const program = Effect.gen(function* () {
 *   const svc = yield* McpServerService;
 *   const session = yield* svc.setSession();
 *   const session = yield* svc.getSession(sessionId);
 * });
 * ```
 */
export class McpService extends Effect.Service<McpService>()(
	"McpService",
	{
		scoped: Effect.gen(function* () {
			const config = yield* AppConfig;
			const domain = yield* CoffeeDomain;

			const sessionsRef = yield* Ref.make<Map<string, SessionEntry>>(
				new Map(),
			);

			const appLayer = Layer.mergeAll(
				Layer.succeed(CoffeeDomain, domain),
				Layer.succeed(AppConfig, config),
			);
			const runtime = ManagedRuntime.make(appLayer);

			yield* Effect.addFinalizer(() =>
				Effect.promise(() => runtime.dispose()),
			);

			return {
				start: () => Effect.void,

				stop: () =>
					Effect.gen(function* () {
						const sessions = yield* Ref.get(sessionsRef);
						for (const [, entry] of sessions) {
							yield* Effect.promise(() => entry.sdkTransport.close());
						}
						sessions.clear();
						yield* Effect.logInfo("All MCP sessions closed");
					}),

				getSession: (sessionId: string) =>
					Effect.gen(function* () {
						const sessions = yield* Ref.get(sessionsRef);
						const entry = sessions.get(sessionId);
						if (!entry) {
							return yield* Effect.fail(
								new SessionNotFoundError({ sessionId }),
							);
						}
						return entry;
					}),

				setSession: () =>
					Effect.gen(function* () {
						const server = new McpServer({
							name: config.name,
							version: config.version,
						});

						domain.registerCoffeeTools(server, config.activeTools, runtime);

						if (config.mode === "http") {
							const sdkTransport = new NodeStreamableHTTPServerTransport({
								sessionIdGenerator: () => randomUUID(),
								onsessioninitialized: (sid) => {
									const sessions = Effect.runSync(Ref.get(sessionsRef));
									sessions.set(sid, { server, sdkTransport });
								},
							});

							sdkTransport.onclose = () => {
								if (sdkTransport.sessionId) {
									const sessions = Effect.runSync(Ref.get(sessionsRef));
									sessions.delete(sdkTransport.sessionId);
								}
							};

							yield* Effect.promise(() => server.connect(sdkTransport));

							return { server, sdkTransport } satisfies SessionEntry;
						}

						// stdio mode — fixed session ID
						const sdkTransport = new StdioServerTransport();
						const sessionId = "stdio";

						yield* Ref.update(sessionsRef, (sessions) => {
							const next = new Map(sessions);
							next.set(sessionId, { server, sdkTransport });
							return next;
						});

						yield* Effect.promise(() => server.connect(sdkTransport));
						yield* Effect.logInfo("MCP Server running on stdio");

						return { server, sdkTransport } satisfies SessionEntry;
					}),

				deleteSession: (sessionId: string) =>
					Effect.gen(function* () {
						const sessions = yield* Ref.get(sessionsRef);
						const entry = sessions.get(sessionId);
						if (entry) {
							yield* Effect.promise(() => entry.sdkTransport.close());
							sessions.delete(sessionId);
						}
					}),
			} satisfies McpServiceInterface;
		}),
		dependencies: [CoffeeDomain.Default],
	},
) { }