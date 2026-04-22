/**
 * Shared transport abstraction — {@link Context.Tag} and
 * {@link TransportShape} interface for dependency-injected transport
 * selection.
 *
 * @remarks
 * Defines a polymorphic {@link Transport} tag that both
 * {@link HttpTransportLive} satisfies.
 * The transport is a **protocol adapter** responsible for:
 *
 * - **Parsing** wire-format input into {@link McpRequest} DTOs
 * - **Responding** by encoding {@link McpResponse} DTOs back to the wire
 * - **Delegating MCP messages** to the SDK transport for protocol handling
 *
 * Consumer code (e.g. {@link McpServerService}) resolves the
 * {@link Transport} service from the Effect container, remaining
 * agnostic to the concrete transport implementation.  This enables
 * future transport additions (e.g. WebSocket) without changing the
 * consumer.
 *
 * @module
 */
import { Context, type Effect } from "effect";
import type { McpRequest } from "../schema/request/mcp-request.js";
import type { McpResponse } from "../schema/response/mcp-response.js";

/**
 * Opaque SDK transport handle passed to {@link TransportShape.handleMcp}.
 *
 * @remarks
 * Intentionally typed as `unknown` to avoid coupling this module to
 * a specific SDK transport class (`NodeStreamableHTTPServerTransport`
 * or `StdioServerTransport`).  The transport implementation casts
 * internally when delegating.
 */
export type SdkTransport = unknown;

/**
 * Service contract for an MCP transport layer.
 *
 * @remarks
 * Every transport implementation provides three methods that separate
 * wire-format concerns from business logic:
 *
 * | Method | Responsibility |
 * |--------|---------------|
 * | {@link parse} | Converts raw wire input into an {@link McpRequest} DTO |
 * | {@link respond} | Encodes an {@link McpResponse} DTO and writes it to the wire |
 * | {@link handleMcp} | Delegates an MCP message to the SDK transport for protocol handling |
 *
 * Transport implementations are thin — all data transformation logic
 * lives in the DTO static methods ({@link McpRequest.decodeRawHttpRequest},
 * {@link McpResponse.encodeRawHttpResponse}, etc.).
 */
export interface TransportShape {
	/**
	 * Parses raw wire input into an {@link McpRequest} DTO.
	 *
	 * @remarks
	 * - **HTTP**: input is `{ req, res, body }` → delegates to
	 *   {@link McpRequest.decodeRawHttpRequest}
	 * - **stdio**: input is `{ body }` → delegates to
	 *   {@link McpRequest.decodeRawStdioMessage}
	 *
	 * @param raw - Wire-format input from the transport layer.
	 * @returns An {@link Effect.Effect} yielding a validated
	 *          {@link McpRequest}.
	 */
	readonly parse: (raw: unknown) => Effect.Effect<McpRequest>;

	/**
	 * Encodes an {@link McpResponse} and writes it to the wire.
	 *
	 * @remarks
	 * - **HTTP**: encodes via {@link McpResponse.encodeRawHttpResponse}
	 *   and writes status/headers/body to the {@link ServerResponse}
	 *   stored in `request.raw`.
	 * - **stdio**: no-op — responses flow through the SDK transport.
	 *
	 * @param request - The original {@link McpRequest} (carries `raw`
	 *        context needed to write the response).
	 * @param response - The {@link McpResponse} to send.
	 * @returns An {@link Effect.Effect} that resolves once the response
	 *          is written.
	 */
	readonly respond: (
		request: McpRequest,
		response: McpResponse,
	) => Effect.Effect<void>;

	/**
	 * Delegates an MCP protocol message to the SDK transport for
	 * handling.
	 *
	 * @remarks
	 * - **HTTP**: casts `request.raw` to {@link HttpRawContext} and calls
	 *   `sdkTransport.handleRequest(req, res, body)`.
	 * - **stdio**: no-op — the SDK reads directly from `stdin` after
	 *   `server.connect()`.
	 *
	 * @param request - The {@link McpRequest} containing the raw context
	 *        and parsed body.
	 * @param sdkTransport - The SDK transport instance to delegate to.
	 * @returns An {@link Effect.Effect} that resolves once the SDK has
	 *          processed the message.
	 */
	readonly handleMcp: (
		request: McpRequest,
		sdkTransport: SdkTransport,
	) => Effect.Effect<void>;
}

/**
 * Effect {@link Context.Tag} identifying the {@link TransportShape}
 * service in the dependency graph.
 *
 * @remarks
 * Registered under the string identifier `"Transport"`.  Consumer code
 * yields this tag inside an {@link Effect.gen} block to obtain the
 * transport implementation provided by the current {@link Layer} — either
 * `HttpTransportLive`, selected at startup based
 * on {@link AppConfig.mode}.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Transport } from "./transport.js";
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* Transport;
 *   const request = yield* transport.parse(rawInput);
 * });
 * ```
 */
export class Transport extends Context.Tag("Transport")<
	Transport,
	TransportShape
>() { }
