# Coffee Mate MCP Server

A TypeScript MCP (Model Context Protocol) server that serves coffee data. Originally based on the Medium article [A Quick Step-by-Step Guide to Writing an MCP Server in TypeScript](https://medium.com/@perrygeorge94/a-quick-step-by-step-guide-to-writing-an-mcp-server-in-typescript-589db5651c3b) by Perry George. Supports both Streamable HTTP and stdio transports.

## Prerequisites

- Node.js 24+
- npm
- Docker (optional, for containerized deployment)

## Setup

```bash
npm install
npm run build
```

### Docker

```bash
docker build -t coffee-mate-mcp .
docker run -p 3001:3001 coffee-mate-mcp
```

## Running

**HTTP mode (default)** — starts a raw Node.js Streamable HTTP server:

```bash
node build/app/main.js
# MCP Server running on http://0.0.0.0:3001
```

Set the `PORT` environment variable to change the port (default `3001`).

**stdio mode** — for local VS Code integration:

```bash
node build/app/main.js --stdio
# MCP Server running on stdio
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Healthcheck — returns `{ "status": "ok" }` |
| `/mcp` | POST | MCP JSON-RPC message handler (initialize creates a session) |
| `/mcp` | GET | SSE backward-compatibility stream |
| `/mcp` | DELETE | Explicit session termination |

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-coffees` | Returns a list of all coffees | None |
| `get-a-coffee` | Retrieves data for a specific coffee by name | `name` (string) |

## Connecting to VS Code

The project includes a `.vscode/mcp.json` config that uses stdio mode. Open the workspace in VS Code, start the MCP server from the config file, and use the tools via GitHub Copilot in Agent mode.

## Docker Networking (n8n integration)

When running inside the `first-n8n` Docker Compose stack, this server is available to other containers at `http://coffee-mate-mcp:3001/mcp` on the `demo` network. See the `first-n8n` project for the full stack setup.

## API Documentation

TypeScript API docs are generated as Markdown in `docs/api/` using [TypeDoc](https://typedoc.org/) with [typedoc-plugin-markdown](https://github.com/typedoc2md/typedoc-plugin-markdown) and [typedoc-plugin-remark](https://github.com/typedoc2md/typedoc-plugin-markdown/tree/main/packages/typedoc-plugin-remark). Generated files are committed and enforced in CI.

### Commands

```bash
npm run docs          # Generate + remark-format docs (commit the result)
npm run docs:lint     # Lint committed docs/api with remark
```

### Workflow

1. Make source changes
2. Run `npm run docs` to regenerate API docs
3. Commit the updated `docs/api/` alongside your code changes

CI runs `npm run docs` then `git diff --exit-code docs/api` — the build fails if committed docs are out of sync with the source.
