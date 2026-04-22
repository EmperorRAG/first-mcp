/**
 * Implementation of {@link McpService.setSession}.
 *
 * @remarks
 * Constructs a new {@link McpServer}, registers the active domain
 * tools, and pairs it with the appropriate SDK transport based on
 * {@link AppConfig.mode}:
 *
 * - **HTTP**: a {@link NodeStreamableHTTPServerTransport} with a
 *   `randomUUID` session-id generator. The session is added to the
 *   sessions map from the `onsessioninitialized` callback and
 *   removed from `onclose`.
 * - **stdio**: a {@link StdioServerTransport} stored under the
 *   fixed key `"stdio"` via {@link Ref.update}.
 *
 * Yields {@link AppConfig}, {@link CoffeeDomain},
 * {@link SessionsRefTag}, and {@link McpRuntimeTag} from the Effect
 * context.
 *
 * @module
 */
import { randomUUID } from "node:crypto";
import { Effect, Ref } from "effect";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { StdioServerTransport } from "@modelcontextprotocol/server";
import { AppConfig } from "../../../config/app/app-config.js";
import { CoffeeDomain } from "../../coffee/domain.js";
import { SessionsRefTag } from "../shared/type/sessions-ref/sessions-ref.tag.js";
import { McpRuntimeTag } from "../shared/type/mcp-runtime/mcp-runtime.tag.js";

/**
 * Creates a new MCP session, registers domain tools, connects the
 * SDK transport, stores the resulting session entry, and
 * returns it.
 */
export const setSession = () =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const domain = yield* CoffeeDomain;
		const sessionsRef = yield* SessionsRefTag;
		const runtime = yield* McpRuntimeTag;

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

			return { server, sdkTransport }
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

		return { server, sdkTransport }
	});
