# Coffee Mate MCP Server

A TypeScript MCP (Model Context Protocol) server that serves coffee data. This project is an implementation of the Medium article [A Quick Step-by-Step Guide to Writing an MCP Server in TypeScript](https://medium.com/@perrygeorge94/a-quick-step-by-step-guide-to-writing-an-mcp-server-in-typescript-589db5651c3b) by Perry George. Its purpose is to explore TypeScript MCP server creation using the stdio transport.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
npm run build
```

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-coffees` | Returns a list of all coffees | None |
| `get-a-coffee` | Retrieves data for a specific coffee by name | `name` (string) |

## Connecting to VS Code

The project includes a `.vscode/mcp.json` config. Open the workspace in VS Code, start the MCP server from the config file, and use the tools via GitHub Copilot in Agent mode.
