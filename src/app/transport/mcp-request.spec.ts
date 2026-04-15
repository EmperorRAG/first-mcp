/**
 * Unit tests for the {@link McpRequest} Schema.TaggedClass DTO.
 *
 * @remarks
 * Validates all static decode/encode methods and the constructor.
 * HTTP-specific tests use mock {@link IncomingMessage} /
 * {@link ServerResponse} objects.
 *
 * @module
 */
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { McpRequest } from "./mcp-request.js";

describe("McpRequest", () => {
	it("creates an instance via new without validation", () => {
		const req = new McpRequest({
			method: "POST",
			path: "/mcp",
			sessionId: undefined,
			body: {},
			isInitialize: false,
			host: "localhost:3001",
			raw: {},
		});
		expect(req._tag).toBe("McpRequest");
		expect(req.method).toBe("POST");
		expect(req.path).toBe("/mcp");
	});

	it("decode succeeds with _tag present", async () => {
		const result = await Effect.runPromise(
			McpRequest.decode({
				_tag: "McpRequest",
				method: "GET",
				path: "/health",
				sessionId: undefined,
				body: undefined,
				isInitialize: false,
				host: "localhost",
				raw: {},
			}),
		);
		expect(result).toBeInstanceOf(McpRequest);
		expect(result.method).toBe("GET");
	});

	it("decode fails without _tag", async () => {
		const result = await Effect.runPromise(
			McpRequest.decode({
				method: "GET",
				path: "/health",
				sessionId: undefined,
				body: undefined,
				isInitialize: false,
				host: "localhost",
				raw: {},
			}).pipe(Effect.either),
		);
		expect(result._tag).toBe("Left");
	});

	it("decodeRaw succeeds without _tag", async () => {
		const result = await Effect.runPromise(
			McpRequest.decodeRaw({
				method: "POST",
				path: "/mcp",
				sessionId: "abc",
				body: {},
				isInitialize: false,
				host: "localhost",
				raw: {},
			}),
		);
		expect(result).toBeInstanceOf(McpRequest);
		expect(result._tag).toBe("McpRequest");
	});

	it("encode produces object with _tag", async () => {
		const req = new McpRequest({
			method: "POST",
			path: "/mcp",
			sessionId: undefined,
			body: {},
			isInitialize: false,
			host: "localhost",
			raw: {},
		});
		const encoded = await Effect.runPromise(McpRequest.encode(req));
		expect(encoded._tag).toBe("McpRequest");
		expect(encoded.method).toBe("POST");
	});

	it("encodeRaw produces object without _tag", async () => {
		const req = new McpRequest({
			method: "POST",
			path: "/mcp",
			sessionId: undefined,
			body: {},
			isInitialize: false,
			host: "localhost",
			raw: {},
		});
		const encoded = await Effect.runPromise(McpRequest.encodeRaw(req));
		expect(encoded).not.toHaveProperty("_tag");
		expect(encoded.method).toBe("POST");
	});

	it("decodeRawHttpRequest transforms HTTP input", async () => {
		const socket = new Socket();
		const req = new IncomingMessage(socket);
		req.method = "POST";
		req.url = "/mcp";
		req.headers.host = "localhost:3001";
		req.headers["mcp-session-id"] = "test-session";
		const res = new ServerResponse(req);

		const result = await Effect.runPromise(
			McpRequest.decodeRawHttpRequest({
				req,
				res,
				body: { jsonrpc: "2.0", method: "tools/list", id: 1 },
			}),
		);

		expect(result).toBeInstanceOf(McpRequest);
		expect(result.method).toBe("POST");
		expect(result.path).toBe("/mcp");
		expect(result.sessionId).toBe("test-session");
		expect(result.host).toBe("localhost:3001");
		expect(result.isInitialize).toBe(false);
	});

	it("decodeRawHttpRequest detects initialize requests", async () => {
		const socket = new Socket();
		const req = new IncomingMessage(socket);
		req.method = "POST";
		req.url = "/mcp";
		req.headers.host = "localhost:3001";
		const res = new ServerResponse(req);

		const result = await Effect.runPromise(
			McpRequest.decodeRawHttpRequest({
				req,
				res,
				body: {
					jsonrpc: "2.0",
					method: "initialize",
					params: {
						protocolVersion: "2025-03-26",
						capabilities: {},
						clientInfo: { name: "test", version: "1.0.0" },
					},
					id: 1,
				},
			}),
		);

		expect(result.isInitialize).toBe(true);
	});

	it("decodeRawStdioMessage transforms stdio input", async () => {
		const result = await Effect.runPromise(
			McpRequest.decodeRawStdioMessage({
				body: { jsonrpc: "2.0", method: "tools/list", id: 1 },
			}),
		);

		expect(result).toBeInstanceOf(McpRequest);
		expect(result.method).toBe("MESSAGE");
		expect(result.path).toBe("/");
		expect(result.sessionId).toBeUndefined();
		expect(result.host).toBeUndefined();
		expect(result.isInitialize).toBe(false);
	});
});
