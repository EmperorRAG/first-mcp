/**
 * Implementation of {@link HttpService.start}.
 *
 * @remarks
 * Creates a `node:http` server whose request callback dispatches into
 * the Effect runtime via {@link handleRequest}. Captures the current
 * Effect runtime once via {@link Effect.runtime} so that each request
 * can reuse it instead of constructing a new layer per call. Stores
 * the bound server in {@link ServerRefTag}.
 *
 * @module
 */
import { createServer } from "node:http";
import { Effect, Ref, Runtime } from "effect";
import { AppConfig } from "../../../config/app/app-config.js";
import { McpService } from "../../mcp/mcp.service.js";
import { handleRequest } from "../handle-request/handle-request.js";
import { ServerRefTag } from "../shared/type/server-ref/server-ref.tag.js";

/**
 * Binds the TCP server and begins accepting requests.
 */
export const start = () =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const serverRef = yield* ServerRefTag;
		const runtime = yield* Effect.runtime<McpService | AppConfig>();
		const runPromise = Runtime.runPromise(runtime);

		const httpServer = createServer((req, res) => {
			void runPromise(handleRequest(req, res));
		});

		yield* Effect.async<void>((resume) => {
			httpServer.listen(config.port, "0.0.0.0", () => {
				resume(Effect.void);
			});
		});

		yield* Ref.set(serverRef, httpServer);
		yield* Effect.logInfo(
			`MCP Server running on http://0.0.0.0:${config.port}`,
		);
	});
