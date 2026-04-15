/**
 * Unified MCP response DTO — a {@link Schema.TaggedClass} that
 * encapsulates outbound response data and owns all format-specific
 * encode transformations via static methods.
 *
 * @remarks
 * The {@link McpResponse} class is the canonical representation of an
 * outgoing response regardless of wire format.  Transport
 * implementations call the appropriate `encodeRaw*` static method to
 * serialise an instance into their native data shape:
 *
 * | Transport | Entry point |
 * |-----------|-------------|
 * | HTTP | {@link McpResponse.encodeRawHttpResponse} — to `{ status, body, headers }` |
 * | stdio | Responses flow through the SDK transport; no explicit encoding needed |
 *
 * Instantiation via `new McpResponse(...)` bypasses schema validation
 * and is suitable when fields are already trusted.  The `decode*`
 * static methods use {@link Schema.decodeUnknown} for validated
 * creation from untrusted input.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * Default CORS response headers attached to every HTTP response.
 *
 * @remarks
 * Permits cross-origin requests from any origin (`*`) and exposes the
 * MCP-specific headers (`Mcp-Session-Id`, `Mcp-Protocol-Version`) that
 * clients need to read from responses.  The `WWW-Authenticate` header is
 * also exposed to support future authentication challenges.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS | MDN — Cross-Origin Resource Sharing}
 */
export const CORS_HEADERS: Readonly<Record<string, string>> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
	"Access-Control-Expose-Headers":
		"Mcp-Session-Id, Mcp-Protocol-Version, WWW-Authenticate",
};

/**
 * Wire shape produced by {@link McpResponse.encodeRawHttpResponse}.
 *
 * @remarks
 * Contains everything needed to write a complete HTTP response: the
 * status code, a pre-serialised JSON body string (or `undefined` for
 * no-body responses like `204`), and merged headers including
 * {@link CORS_HEADERS} and `Content-Length`.
 */
export interface HttpResponseData {
	readonly status: number;
	readonly body: string | undefined;
	readonly headers: Record<string, string>;
}

/**
 * Unified MCP response DTO built on {@link Schema.TaggedClass}.
 *
 * @remarks
 * Fields capture the minimal set of data needed to write a response
 * to any transport:
 *
 * | Field | Purpose |
 * |-------|---------|
 * | `status` | HTTP status code (e.g. `200`, `400`, `404`) |
 * | `body` | JSON-serialisable response payload, or `undefined` for no-body responses |
 * | `headers` | Additional response headers (merged with {@link CORS_HEADERS} during HTTP encoding) |
 */
export class McpResponse extends Schema.TaggedClass<McpResponse>()(
	"McpResponse",
	{
		status: Schema.Number,
		body: Schema.UndefinedOr(Schema.Unknown),
		headers: Schema.UndefinedOr(
			Schema.Record({ key: Schema.String, value: Schema.String }),
		),
	},
) {
	/**
	 * Validates unknown input containing a `_tag: "McpResponse"`
	 * discriminator and produces an {@link McpResponse} instance.
	 *
	 * @param input - Untrusted data expected to include `_tag`.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpResponse}.
	 */
	static decode(input: unknown) {
		return Schema.decodeUnknown(McpResponse)(input);
	}

	/**
	 * Validates unknown input **without** a `_tag` discriminator and
	 * produces an {@link McpResponse} instance.
	 *
	 * @param input - Untrusted data with no `_tag` field.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpResponse}.
	 */
	static decodeRaw(input: unknown) {
		return Schema.decodeUnknown(McpResponseFromRaw)(input);
	}

	/**
	 * Encodes an {@link McpResponse} to a plain object **with** the
	 * `_tag: "McpResponse"` discriminator.
	 *
	 * @param value - The DTO instance to encode.
	 * @returns An {@link Effect.Effect} yielding the encoded object.
	 */
	static encode(value: McpResponse) {
		return Schema.encode(McpResponse)(value);
	}

	/**
	 * Encodes an {@link McpResponse} to a plain object **without** the
	 * `_tag` discriminator.
	 *
	 * @param value - The DTO instance to encode.
	 * @returns An {@link Effect.Effect} yielding the encoded object
	 *          (no `_tag`).
	 */
	static encodeRaw(value: McpResponse) {
		return Schema.encode(McpResponseFromRaw)(value);
	}

	/**
	 * Encodes an {@link McpResponse} into an {@link HttpResponseData}
	 * object ready to be written to a Node.js {@link ServerResponse}.
	 *
	 * @remarks
	 * The encoding:
	 *
	 * 1. Serialises `body` to JSON (or `undefined` for no-body responses).
	 * 2. Computes `Content-Length` via {@link Buffer.byteLength} for
	 *    correct multi-byte UTF-8 handling.
	 * 3. Merges {@link CORS_HEADERS}, a `Content-Type` header, and any
	 *    additional `headers` from the DTO.
	 *
	 * @param value - The DTO instance to encode.
	 * @returns An {@link HttpResponseData} with `status`, `body`, and
	 *          fully-merged `headers`.
	 */
	static encodeRawHttpResponse(value: McpResponse): HttpResponseData {
		const json = value.body !== undefined ? JSON.stringify(value.body) : undefined;
		const merged: Record<string, string> = { ...CORS_HEADERS };

		if (json !== undefined) {
			merged["Content-Type"] = "application/json";
			merged["Content-Length"] = String(Buffer.byteLength(json));
		}

		if (value.headers) {
			Object.assign(merged, value.headers);
		}

		return { status: value.status, body: json, headers: merged };
	}
}

/**
 * Companion schema matching {@link McpResponse} fields but without
 * the `_tag` discriminator.
 *
 * @remarks
 * Used by {@link McpResponseFromRaw} to decode/encode data that lacks
 * the `Schema.TaggedClass` discriminator field.
 *
 * @internal
 */
const McpResponseFields = Schema.Struct({
	status: Schema.Number,
	body: Schema.UndefinedOr(Schema.Unknown),
	headers: Schema.UndefinedOr(
		Schema.Record({ key: Schema.String, value: Schema.String }),
	),
});

/**
 * Transform schema bridging raw (no `_tag`) objects to
 * {@link McpResponse} instances and back.
 *
 * @remarks
 * Decode direction: plain fields → `new McpResponse(fields)`.
 * Encode direction: strips the `_tag` property from the instance.
 *
 * @internal
 */
const McpResponseFromRaw = Schema.transform(McpResponseFields, McpResponse, {
	strict: true,
	decode: (fields) => new McpResponse(fields),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	encode: ({ _tag: _tag, ...rest }) => rest,
});
