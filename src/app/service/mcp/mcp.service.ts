/**
 * MCP server session manager — {@link Effect.Service} that owns
 * the lifecycle of all MCP sessions.
 *
 * @module
 */
import { Effect, Layer, ManagedRuntime, Ref } from "effect";
import type { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import type { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { AppConfig } from "../../config/app/app-config.js";
import { CoffeeDomain } from "../coffee/coffee.service.js";
import { SessionsRefTag } from "./shared/type/sessions-ref/sessions-ref.tag.js";
import { McpRuntimeTag } from "./shared/type/mcp-runtime/mcp-runtime.tag.js";
import { start } from "./start/start.js";
import { stop } from "./stop/stop.js";
import { getSession } from "./get-session/get-session.js";
import { setSession } from "./set-session/set-session.js";
import { deleteSession } from "./delete-session/delete-session.js";
import { registerCoffeeTools } from "./register-coffee-tools/register-coffee-tools.js";

/**
 * Effect service managing MCP server sessions. Composes the per-method
 * Effects in `start/`, `stop/`, `get-session/`, `set-session/`, and
 * `delete-session/` by providing them with an internal layer that
 * carries the sessions {@link Ref}, the {@link ManagedRuntime}, and
 * the resolved {@link AppConfig} / {@link CoffeeDomain} services.
 */
export class McpService extends Effect.Service<McpService>()(
	"McpService",
	{
		scoped: Effect.gen(function* () {
			const config = yield* AppConfig;
			const domain = yield* CoffeeDomain;

			const sessionsRef = yield* Ref.make<
				Map<
					string,
					{
						readonly server: McpServer;
						readonly sdkTransport:
						| NodeStreamableHTTPServerTransport
						| StdioServerTransport;
					}
				>
			>(new Map());

			const appLayer = Layer.mergeAll(
				Layer.succeed(CoffeeDomain, domain),
				Layer.succeed(AppConfig, config),
			);
			const runtime = ManagedRuntime.make(appLayer);

			yield* Effect.addFinalizer(() =>
				Effect.promise(() => runtime.dispose()),
			);

			const internalLayer = Layer.mergeAll(
				Layer.succeed(SessionsRefTag, sessionsRef),
				Layer.succeed(McpRuntimeTag, runtime),
				Layer.succeed(AppConfig, config),
				Layer.succeed(CoffeeDomain, domain),
			);

			return {
				start: () => start().pipe(Effect.provide(internalLayer)),
				stop: () => stop().pipe(Effect.provide(internalLayer)),
				getSession: (sessionId: string) =>
					getSession(sessionId).pipe(Effect.provide(internalLayer)),
				setSession: () => setSession().pipe(Effect.provide(internalLayer)),
				deleteSession: (sessionId: string) =>
					deleteSession(sessionId).pipe(Effect.provide(internalLayer)),
				registerCoffeeTools: (
					server: McpServer,
					activeTools: Record<string, boolean>,
				) =>
					registerCoffeeTools(server, activeTools).pipe(
						Effect.provide(internalLayer),
					),
			};
		}),
		dependencies: [CoffeeDomain.Default],
	},
) { }
