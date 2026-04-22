/**
 * Parses a raw HTTP request into an {@link McpRequest} DTO.
 *
 * @remarks
 * Thin wrapper around {@link McpRequest.decodeRawHttpRequest} — kept
 * as its own module so consumers can import the parse step directly
 * without depending on a Transport tag.
 *
 * @module
 */
import type { Effect } from "effect";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpRequest } from "../../../schema/request/mcp-request.js";

/**
 * Wire-format input for an HTTP request before DTO transformation.
 */
export interface HttpRawInput {
	readonly req: IncomingMessage;
	readonly res: ServerResponse;
	readonly body: unknown;
}

/**
 * Decodes a raw HTTP request triple into a validated {@link McpRequest}.
 */
export const parse = (raw: HttpRawInput): Effect.Effect<McpRequest> =>
	McpRequest.decodeRawHttpRequest(raw);
