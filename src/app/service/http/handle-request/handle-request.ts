/**
 * Per-request dispatch loop for the HTTP listener.
 *
 * @remarks
 * Reads the HTTP {@link IncomingMessage}/{@link ServerResponse} pair,
 * parses it into an {@link McpRequest}, resolves the {@link RouteAction},
 * and dispatches to the appropriate per-action handler under
 * `handle-request/`. Catches {@link SessionNotFoundError} (and any other
 * unhandled error) to send a 400/500 fallback when headers have not
 * yet been sent.
 *
 * @module
 */
import { Effect } from "effect";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AppConfig } from "../../../config/app/app-config.js";
import { CORS_HEADERS } from "../../../schema/response/mcp-response.js";
import { McpService } from "../../mcp/mcp.service.js";
import { SessionNotFoundError } from "../../mcp/shared/error/session-not-found/session-not-found.js";
import { parseBody } from "../body-parser/body-parser.js";
import { parse } from "../parse/parse.js";
import { resolve } from "../resolve/resolve.js";
import { handleMcpMessage } from "./handle-mcp-message/handle-mcp-message.js";
import { handleMcpSse } from "./handle-mcp-sse/handle-mcp-sse.js";
import { handleSessionTerminate } from "./handle-session-terminate/handle-session-terminate.js";
import { handleHealthCheck } from "./handle-health-check/handle-health-check.js";
import { handleCorsPreflight } from "./handle-cors-preflight/handle-cors-preflight.js";
import { handleNotFound } from "./handle-not-found/handle-not-found.js";
import { handleForbidden } from "./handle-forbidden/handle-forbidden.js";

/**
 * Handles a single HTTP request from parse → resolve → dispatch with
 * a typed-error fallback that writes a 400/500 if headers are unsent.
 */
export const handleRequest = (
	req: IncomingMessage,
	res: ServerResponse,
): Effect.Effect<void, never, McpService | AppConfig> =>
	Effect.gen(function* () {
		const body = yield* parseBody(req);
		const mcpReq = yield* parse({ req, res, body });
		const action = yield* resolve(mcpReq);

		switch (action) {
			case "mcp-message":
				yield* handleMcpMessage(mcpReq);
				return;
			case "mcp-sse":
				yield* handleMcpSse(mcpReq);
				return;
			case "session-terminate":
				yield* handleSessionTerminate(mcpReq);
				return;
			case "health-check":
				yield* handleHealthCheck(mcpReq);
				return;
			case "cors-preflight":
				yield* handleCorsPreflight(mcpReq);
				return;
			case "not-found":
				yield* handleNotFound(mcpReq);
				return;
			case "forbidden":
				yield* handleForbidden(mcpReq);
				return;
		}
	}).pipe(
		Effect.catchAll((e) =>
			Effect.sync(() => {
				if (!res.headersSent) {
					const isSessionError = e instanceof SessionNotFoundError;
					const status = isSessionError ? 400 : 500;
					const body = isSessionError
						? { error: "Invalid or missing session" }
						: { error: "Internal server error" };
					const json = JSON.stringify(body);
					res.writeHead(status, {
						...CORS_HEADERS,
						"Content-Type": "application/json",
						"Content-Length": Buffer.byteLength(json),
					});
					res.end(json);
				}
			}),
		),
	);
