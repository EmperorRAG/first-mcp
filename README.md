# Coffee Mate MCP Server

A TypeScript MCP (Model Context Protocol) server that serves coffee data. Originally based on the Medium article [A Quick Step-by-Step Guide to Writing an MCP Server in TypeScript](https://medium.com/@perrygeorge94/a-quick-step-by-step-guide-to-writing-an-mcp-server-in-typescript-589db5651c3b) by Perry George. Supports both SSE (HTTP) and stdio transports.

## Prerequisites

- Node.js 18+
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

**SSE mode (default)** — starts an Express HTTP server:

```bash
node build/index.js
# MCP Server running on http://0.0.0.0:3001
```

Set the `PORT` environment variable to change the port (default `3001`).

**stdio mode** — for local VS Code integration:

```bash
node build/index.js --stdio
# MCP Server running on stdio
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Healthcheck — returns `{ "status": "ok" }` |
| `/sse` | GET | SSE connection endpoint for MCP clients |
| `/messages?sessionId=<id>` | POST | JSON-RPC message handler for an active SSE session |

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-coffees` | Returns a list of all coffees | None |
| `get-a-coffee` | Retrieves data for a specific coffee by name | `name` (string) |

## Connecting to VS Code

The project includes a `.vscode/mcp.json` config that uses stdio mode. Open the workspace in VS Code, start the MCP server from the config file, and use the tools via GitHub Copilot in Agent mode.

## Docker Networking (n8n integration)

When running inside the `first-n8n` Docker Compose stack, this server is available to other containers at `http://coffee-mate-mcp:3001/sse` on the `demo` network. See the `first-n8n` project for the full stack setup.
