/**
 * Streamable HTTP transport — raw Node.js HTTP server with Effect lifecycle,
 * session management, health endpoint, and DNS rebinding protection.
 *
 * @remarks
 * Replaces Express with a plain `node:http` server.
 * Session transports are tracked in a `Map` and cleaned up on server close.
 *
 * @module
 */
import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/server";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";

const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
	"Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version, WWW-Authenticate",
};

function getSessionId(req: IncomingMessage): string | undefined {
	const value = req.headers["mcp-session-id"];
	return Array.isArray(value) ? value[0] : value;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
	const json = JSON.stringify(body);
	res.writeHead(status, {
		...CORS_HEADERS,
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(json),
	});
	res.end(json);
}

function parseBody(req: IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => chunks.push(chunk));
		req.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf8");
			try {
				resolve(raw.length > 0 ? JSON.parse(raw) : undefined);
			} catch {
				reject(new Error("Invalid JSON"));
			}
		});
		req.on("error", reject);
	});
}

function isValidHost(host: string | undefined): boolean {
	if (!host) return false;
	const hostname = host.split(":")[0];
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "0.0.0.0" ||
		hostname === "::1"
	);
}

/**
 * Handle returned by `startHttpServer` for lifecycle control.
 */
export interface HttpServerHandle {
	/** Closes all transports and the HTTP server. */
	close: () => Promise<void>;
	/** Returns the bound address (useful when listening on port 0). */
	address: () => AddressInfo | null;
}

/**
 * Starts a raw Node.js HTTP server with MCP Streamable HTTP transport.
 *
 * @param createServer_ - Factory creating a new MCP server per session.
 * @param port - TCP port to listen on.
 *
 * @remarks
 * Lifecycle:
 * - Server closes all active transports when stopped.
 * - Returns a handle the caller can use for graceful shutdown.
 */
export function startHttpServer(
	createServer_: () => McpServer,
	port: number,
): HttpServerHandle {
	const transports = new Map<string, NodeStreamableHTTPServerTransport>();

	async function handlePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const body = await parseBody(req);
		const sessionId = getSessionId(req);

		if (sessionId && transports.has(sessionId)) {
			await transports.get(sessionId)!.handleRequest(req, res, body);
			return;
		}

		if (!sessionId && isInitializeRequest(body)) {
			const transport = new NodeStreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sid) => {
					transports.set(sid, transport);
				},
			});

			transport.onclose = () => {
				if (transport.sessionId) {
					transports.delete(transport.sessionId);
				}
			};

			const server = createServer_();
			await server.connect(transport);
			await transport.handleRequest(req, res, body);
			return;
		}

		sendJson(res, 400, { error: "Invalid request" });
	}

	async function handleGet(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const sessionId = getSessionId(req);

		if (sessionId && transports.has(sessionId)) {
			await transports.get(sessionId)!.handleRequest(req, res);
			return;
		}

		sendJson(res, 400, { error: "Invalid or missing session" });
	}

	async function handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const sessionId = getSessionId(req);

		if (sessionId && transports.has(sessionId)) {
			const transport = transports.get(sessionId)!;
			await transport.close();
			transports.delete(sessionId);
			res.writeHead(200, CORS_HEADERS);
			res.end();
			return;
		}

		sendJson(res, 400, { error: "Invalid or missing session" });
	}

	const httpServer = createServer(async (req, res) => {
		if (!isValidHost(req.headers.host)) {
			sendJson(res, 403, { error: "DNS rebinding protection" });
			return;
		}

		const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
		const path = url.pathname;

		if (req.method === "OPTIONS") {
			res.writeHead(204, CORS_HEADERS);
			res.end();
			return;
		}

		try {
			if (path === "/health" && req.method === "GET") {
				sendJson(res, 200, { status: "ok" });
			} else if (path === "/mcp" && req.method === "POST") {
				await handlePost(req, res);
			} else if (path === "/mcp" && req.method === "GET") {
				await handleGet(req, res);
			} else if (path === "/mcp" && req.method === "DELETE") {
				await handleDelete(req, res);
			} else {
				sendJson(res, 404, { error: "Not found" });
			}
		} catch (error) {
			if (!res.headersSent) {
				sendJson(res, 500, { error: "Internal server error" });
			}
		}
	});

	httpServer.listen(port, "0.0.0.0", () => {
		console.error(`MCP Server running on http://0.0.0.0:${port}`);
	});

	const close = async (): Promise<void> => {
		for (const [, transport] of transports) {
			await transport.close();
		}
		transports.clear();
		await new Promise<void>((resolve) => httpServer.close(() => resolve()));
	};

	return {
		close,
		address: () => httpServer.address() as AddressInfo | null,
	};
}
