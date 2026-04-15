/**
 * Unified MCP request DTO — a {@link Schema.TaggedClass} that
 * encapsulates inbound request data from any transport (HTTP or stdio)
 * and owns all format-specific decode/encode transformations via static
 * methods.
 *
 * @remarks
 * The {@link McpRequest} class is the canonical representation of an
 * incoming MCP message regardless of wire format.  Each transport
 * implementation calls the appropriate `decodeRaw*` static method to
 * produce an instance from its native data shape:
 *
 * | Transport | Entry point |
 * |-----------|-------------|
 * | HTTP | {@link McpRequest.decodeRawHttpRequest} — from `{ req, res, body }` |
 * | stdio | {@link McpRequest.decodeRawStdioMessage} — from `{ body }` |
 *
 * Instantiation via `new McpRequest(...)` bypasses schema validation
 * and is suitable when fields are already trusted.  The `decode*`
 * static methods use {@link Schema.decodeUnknown} for validated
 * creation from untrusted input.
 *
 * @module
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { Effect, Schema } from "effect";

/**
 * Opaque context carried by HTTP-originated requests.
 *
 * @remarks
 * Stored in {@link McpRequest.raw} as `Schema.Unknown`.  Consumers
 * (e.g. {@link Transport.respond}, {@link Transport.handleMcp}) cast
 * the field back to this interface when they need access to the
 * underlying Node.js request/response pair.
 */
export interface HttpRawContext {
	readonly req: IncomingMessage;
	readonly res: ServerResponse;
}

/**
 * Opaque context carried by stdio-originated requests.
 *
 * @remarks
 * Stdio messages have no additional context beyond the parsed body,
 * so this interface is intentionally empty.  It exists for
 * type-symmetry with {@link HttpRawContext}.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StdioRawContext {}

/**
 * Unified MCP request DTO built on {@link Schema.TaggedClass}.
 *
 * @remarks
 * Fields capture every piece of information the router and MCP server
 * service need to process an inbound message:
 *
 * | Field | HTTP | stdio |
 * |-------|------|-------|
 * | `method` | HTTP verb (`"POST"`, `"GET"`, etc.) | `"MESSAGE"` |
 * | `path` | URL pathname (`"/mcp"`, `"/health"`) | `"/"` |
 * | `sessionId` | `Mcp-Session-Id` header value | `undefined` |
 * | `body` | Parsed JSON body | JSON-RPC message |
 * | `isInitialize` | `isInitializeRequest(body)` | same check |
 * | `host` | `Host` header value | `undefined` |
 * | `raw` | {@link HttpRawContext} | {@link StdioRawContext} |
 */
export class McpRequest extends Schema.TaggedClass<McpRequest>()(
	"McpRequest",
	{
		method: Schema.String,
		path: Schema.String,
		sessionId: Schema.UndefinedOr(Schema.String),
		body: Schema.Unknown,
		isInitialize: Schema.Boolean,
		host: Schema.UndefinedOr(Schema.String),
		raw: Schema.Unknown,
	},
) {
	/**
	 * Validates unknown input containing a `_tag: "McpRequest"`
	 * discriminator and produces an {@link McpRequest} instance.
	 *
	 * @param input - Untrusted data expected to include `_tag`.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpRequest}.
	 */
	static decode(input: unknown) {
		return Schema.decodeUnknown(McpRequest)(input);
	}

	/**
	 * Validates unknown input **without** a `_tag` discriminator and
	 * produces an {@link McpRequest} instance.
	 *
	 * @param input - Untrusted data with no `_tag` field.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpRequest}.
	 */
	static decodeRaw(input: unknown) {
		return Schema.decodeUnknown(McpRequestFromRaw)(input);
	}

	/**
	 * Encodes an {@link McpRequest} to a plain object **with** the
	 * `_tag: "McpRequest"` discriminator.
	 *
	 * @param value - The DTO instance to encode.
	 * @returns An {@link Effect.Effect} yielding the encoded object.
	 */
	static encode(value: McpRequest) {
		return Schema.encode(McpRequest)(value);
	}

	/**
	 * Encodes an {@link McpRequest} to a plain object **without** the
	 * `_tag` discriminator.
	 *
	 * @param value - The DTO instance to encode.
	 * @returns An {@link Effect.Effect} yielding the encoded object
	 *          (no `_tag`).
	 */
	static encodeRaw(value: McpRequest) {
		return Schema.encode(McpRequestFromRaw)(value);
	}

	/**
	 * Decodes an HTTP request context into an {@link McpRequest}.
	 *
	 * @remarks
	 * Input shape: `{ req: IncomingMessage, res: ServerResponse, body: unknown }`.
	 * Extracts method, pathname, session ID, host header, and runs
	 * {@link isInitializeRequest} on the body.  The raw `req`/`res`
	 * pair is stored in the `raw` field for downstream SDK delegation.
	 *
	 * @param input - An object with `req`, `res`, and pre-parsed `body`.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpRequest}.
	 */
	static decodeRawHttpRequest(input: {
		readonly req: IncomingMessage;
		readonly res: ServerResponse;
		readonly body: unknown;
	}) {
		const { req, res, body } = input;
		const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
		const sessionIdRaw = req.headers["mcp-session-id"];
		const sessionId = Array.isArray(sessionIdRaw) ? sessionIdRaw[0] : sessionIdRaw;

		return Effect.succeed(
			new McpRequest({
				method: req.method ?? "GET",
				path: url.pathname,
				sessionId,
				body,
				isInitialize: isInitializeRequest(body),
				host: req.headers.host,
				raw: { req, res } satisfies HttpRawContext,
			}),
		);
	}

	/**
	 * Decodes a stdio JSON-RPC message into an {@link McpRequest}.
	 *
	 * @remarks
	 * Input shape: `{ body: unknown }`.  Produces fixed values for
	 * HTTP-centric fields (`method: "MESSAGE"`, `path: "/"`,
	 * `sessionId: undefined`, `host: undefined`).
	 *
	 * @param input - An object with the parsed JSON-RPC `body`.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpRequest}.
	 */
	static decodeRawStdioMessage(input: { readonly body: unknown }) {
		return Effect.succeed(
			new McpRequest({
				method: "MESSAGE",
				path: "/",
				sessionId: undefined,
				body: input.body,
				isInitialize: isInitializeRequest(input.body),
				host: undefined,
				raw: {} satisfies StdioRawContext,
			}),
		);
	}
}

/**
 * Companion schema matching {@link McpRequest} fields but without the
 * `_tag` discriminator.
 *
 * @remarks
 * Used by {@link McpRequestFromRaw} to decode/encode data that lacks
 * the `Schema.TaggedClass` discriminator field.
 *
 * @internal
 */
const McpRequestFields = Schema.Struct({
	method: Schema.String,
	path: Schema.String,
	sessionId: Schema.UndefinedOr(Schema.String),
	body: Schema.Unknown,
	isInitialize: Schema.Boolean,
	host: Schema.UndefinedOr(Schema.String),
	raw: Schema.Unknown,
});

/**
 * Transform schema bridging raw (no `_tag`) objects to
 * {@link McpRequest} instances and back.
 *
 * @remarks
 * Decode direction: plain fields → `new McpRequest(fields)`.
 * Encode direction: strips the `_tag` property from the instance.
 *
 * @internal
 */
const McpRequestFromRaw = Schema.transform(McpRequestFields, McpRequest, {
	strict: true,
	decode: (fields) => new McpRequest(fields),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	encode: ({ _tag: _tag, ...rest }) => rest,
});
