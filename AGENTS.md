# Project Guidelines

## Architecture

MCP (Model Context Protocol) server with dual transport. Single entry point at `src/index.ts` that registers tools via `McpServer.registerTool()`. TypeScript source in `src/` compiles to `build/`.

Two transport modes:

- **Streamable HTTP (default)**: Express HTTP server exposing `POST /mcp`, `GET /mcp` (SSE backward compat), `DELETE /mcp` (session termination), and `GET /health`. Uses `NodeStreamableHTTPServerTransport` with stateful sessions (`Mcp-Session-Id` header). `createMcpExpressApp()` provides DNS rebinding protection. Used for Docker and network-based clients.
- **stdio (`--stdio` flag)**: `StdioServerTransport` for local VS Code MCP integration via `.vscode/mcp.json`.

## Build and Test

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript (src/ → build/)
docker build -t coffee-mate-mcp .  # Build Docker image
```

After code changes, always run `npm run build` before testing the MCP server. When running inside Docker Compose (via `first-n8n`), use `--build` flag to pick up source changes.

## Conventions

- **ES Modules**: Project uses `"type": "module"` — use `import`/`export`, not `require`
- **Tool registration**: Use `server.registerTool(name, config, handler)` — the older `server.tool()` is deprecated
- **Input validation**: Use Zod schemas via `inputSchema` in the tool config object
- **Tool responses**: Always return `{ content: [{ type: "text", text: string }] }`
- **Strict TypeScript**: `strict: true` is enabled — no implicit `any`, null checks required
- **Zod import**: Use `import * as z from "zod/v4"` (SDK v2 convention)
- **Body parsing**: Always pass `req.body` as the third argument to `transport.handleRequest(req, res, req.body)` — `express.json()` consumes the stream, so the SDK cannot re-read it
- **Session management**: Each `POST /mcp` initialize request creates a new `NodeStreamableHTTPServerTransport` and `McpServer` instance; subsequent requests reuse the transport via the `Mcp-Session-Id` header
- **Port configuration**: `PORT` env var controls HTTP server port (default `3001`)
- **Health endpoint**: `GET /health` returns `{ status: "ok" }` — used by Docker healthcheck
