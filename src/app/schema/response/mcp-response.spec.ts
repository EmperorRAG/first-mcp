/**
 * Unit tests for the {@link McpResponse} Schema.TaggedClass DTO.
 *
 * @remarks
 * Validates all static decode/encode methods, the constructor, and the
 * {@link CORS_HEADERS} constant.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { McpResponse, CORS_HEADERS } from "./mcp-response.js";

describe("McpResponse", () => {
	it("creates an instance via new without validation", () => {
		const res = new McpResponse({
			status: 200,
			body: { ok: true },
			headers: undefined,
		});
		expect(res._tag).toBe("McpResponse");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ ok: true });
	});

	it("decode succeeds with _tag present", async () => {
		const result = await Effect.runPromise(
			McpResponse.decode({
				_tag: "McpResponse",
				status: 404,
				body: { error: "Not found" },
				headers: undefined,
			}),
		);
		expect(result).toBeInstanceOf(McpResponse);
		expect(result.status).toBe(404);
	});

	it("decode fails without _tag", async () => {
		const result = await Effect.runPromise(
			McpResponse.decode({
				status: 200,
				body: undefined,
				headers: undefined,
			}).pipe(Effect.either),
		);
		expect(result._tag).toBe("Left");
	});

	it("decodeRaw succeeds without _tag", async () => {
		const result = await Effect.runPromise(
			McpResponse.decodeRaw({
				status: 204,
				body: undefined,
				headers: undefined,
			}),
		);
		expect(result).toBeInstanceOf(McpResponse);
		expect(result._tag).toBe("McpResponse");
		expect(result.status).toBe(204);
	});

	it("encode produces object with _tag", async () => {
		const res = new McpResponse({
			status: 200,
			body: "hello",
			headers: undefined,
		});
		const encoded = await Effect.runPromise(McpResponse.encode(res));
		expect(encoded._tag).toBe("McpResponse");
		expect(encoded.status).toBe(200);
	});

	it("encodeRaw produces object without _tag", async () => {
		const res = new McpResponse({
			status: 200,
			body: "hello",
			headers: undefined,
		});
		const encoded = await Effect.runPromise(McpResponse.encodeRaw(res));
		expect(encoded).not.toHaveProperty("_tag");
		expect(encoded.status).toBe(200);
	});

	describe("encodeRawHttpResponse", () => {
		it("includes CORS headers and Content-Type for JSON body", () => {
			const res = new McpResponse({
				status: 200,
				body: { status: "ok" },
				headers: undefined,
			});
			const data = McpResponse.encodeRawHttpResponse(res);

			expect(data.status).toBe(200);
			expect(data.body).toBe('{"status":"ok"}');
			expect(data.headers["Content-Type"]).toBe("application/json");
			expect(data.headers["Content-Length"]).toBe(
				String(Buffer.byteLength('{"status":"ok"}')),
			);
			expect(data.headers["Access-Control-Allow-Origin"]).toBe("*");
		});

		it("omits Content-Type/Length for undefined body", () => {
			const res = new McpResponse({
				status: 204,
				body: undefined,
				headers: undefined,
			});
			const data = McpResponse.encodeRawHttpResponse(res);

			expect(data.status).toBe(204);
			expect(data.body).toBeUndefined();
			expect(data.headers).not.toHaveProperty("Content-Type");
			expect(data.headers).not.toHaveProperty("Content-Length");
			expect(data.headers["Access-Control-Allow-Origin"]).toBe("*");
		});

		it("merges additional headers from the DTO", () => {
			const res = new McpResponse({
				status: 200,
				body: { ok: true },
				headers: { "X-Custom": "value" },
			});
			const data = McpResponse.encodeRawHttpResponse(res);

			expect(data.headers["X-Custom"]).toBe("value");
			expect(data.headers["Access-Control-Allow-Origin"]).toBe("*");
		});
	});

	it("CORS_HEADERS includes required fields", () => {
		expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
		expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toContain("POST");
		expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toContain(
			"Mcp-Session-Id",
		);
		expect(CORS_HEADERS["Access-Control-Expose-Headers"]).toContain(
			"Mcp-Session-Id",
		);
	});
});
