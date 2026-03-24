# Project Guidelines

## Architecture

MCP (Model Context Protocol) server using stdio transport. Single entry point at `src/index.ts` that registers tools via `McpServer.registerTool()` and connects over `StdioServerTransport`. TypeScript source in `src/` compiles to `build/`.

## Build and Test

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript (src/ → build/)
```

After code changes, always run `npm run build` before testing the MCP server.

## Conventions

- **ES Modules**: Project uses `"type": "module"` — use `import`/`export`, not `require`
- **Tool registration**: Use `server.registerTool(name, config, handler)` — the older `server.tool()` is deprecated
- **Input validation**: Use Zod schemas via `inputSchema` in the tool config object
- **Tool responses**: Always return `{ content: [{ type: "text", text: string }] }`
- **Strict TypeScript**: `strict: true` is enabled — no implicit `any`, null checks required
