# Project Guidelines

## Architecture

MCP (Model Context Protocol) server with dual transport using an Effect-TS domain-service architecture. TypeScript source in `src/` compiles to `build/`. Entry point at `src/app/main.ts`.

### Source Structure

```plaintext
src/app/
├── main.ts                             — entry point (--stdio flag selects transport)
├── config/
│   └── app/
│       ├── app-config.ts               — AppConfig Effect Service (PORT, server name/version)
│       └── app-config.spec.ts
├── server/
│   ├── standard-schema-bridge.ts       — toStandardSchema() adapter (Effect Schema → MCP SDK)
│   └── mcp/
│       └── mcp-server.ts              — reserved for future MCP server helpers
├── transport/
│   ├── http/
│   │   ├── http-transport.ts           — raw Node.js Streamable HTTP transport
│   │   └── http-transport.spec.ts
│   └── stdio/
│       ├── stdio.ts                    — Stdio transport for VS Code
│       └── stdio.spec.ts
├── service/
│   └── coffee/                         — coffee domain
│       ├── domain.ts                   — domain barrel (Layer composition + tool registration)
│       ├── domain.spec.ts
│       ├── types.ts                    — Coffee entity (Effect Schema.Struct)
│       ├── errors.ts                   — CoffeeNotFoundError (Data.TaggedError)
│       ├── errors.spec.ts
│       ├── repository/
│       │   ├── coffee-repository.ts    — CoffeeRepository tag + InMemory impl
│       │   └── coffee-repository.spec.ts
│       └── module/
│           ├── get-coffees/
│           │   ├── get-coffees.service.ts      — GetCoffeesService + registerGetCoffeesTool()
│           │   └── get-coffees.service.spec.ts
│           └── get-a-coffee/
│               ├── get-a-coffee.service.ts     — GetACoffeeService + registerGetACoffeeTool()
│               ├── get-a-coffee.service.spec.ts
│               ├── get-a-coffee.schema.ts      — Effect Schema input + StandardSchema adapter
│               └── get-a-coffee.schema.spec.ts
└── testing/                            — test helpers (not shipped)
    ├── factory/
    │   └── coffee.factory.ts           — Coffee fixture builder
    └── utility/
        ├── coffee-parser.utility.ts    — coffee response parsing helpers
        ├── env.utility.ts              — test environment config
        ├── mcp-response.utility.ts     — MCP response assertion helpers
        ├── mcp-server-introspection.utility.ts — tool introspection helpers
        └── reflect.utility.ts          — MCP server reflection helpers
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Domain** (`domain.ts`) | Composes service Layers, provides repository, exports `registerCoffeeTools()` |
| **Service** (`*.service.ts`) | Business logic + MCP `registerTool()` wiring via `registerXxxTool()`. Delegates to repository |
| **Schema** (`*.schema.ts`) | Effect Schema input definitions, JSON Schema derivation, StandardSchema adapter |
| **Repository** (`*.repository.ts`) | Data access interface. `InMemory*` impl for now (database-ready interface) |
| **Types** (`types.ts`) | Domain entities as Effect `Schema.Struct` definitions |
| **Errors** (`errors.ts`) | Domain errors as `Data.TaggedError` — enables `Effect.catchTag` matching |
| **Standard Schema Bridge** (`standard-schema-bridge.ts`) | Adapts Effect Schema to `StandardSchemaWithJSON` for MCP SDK |

### Transport Modes

- **Streamable HTTP (default)**: Raw Node.js HTTP server exposing `POST /mcp`, `GET /mcp` (SSE backward compat), `DELETE /mcp` (session termination), and `GET /health`. Uses `NodeStreamableHTTPServerTransport` with stateful sessions (`Mcp-Session-Id` header). DNS rebinding protection validates `Host` header against loopback addresses. Sessions tracked in an Effect `Ref` holding a transport map. CORS headers added manually. Used for Docker and network-based clients.
- **stdio (`--stdio` flag)**: `StdioServerTransport` for local VS Code MCP integration via `.vscode/mcp.json`.

## Build and Test

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript (src/ → build/)
npm test                 # Run all tests (Vitest)
npm run test:unit        # Unit tests only (*.spec.ts)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run docs             # Generate TypeDoc API docs + remark formatting
npm run docs:lint        # Lint committed docs/api with remark
npm run lint:ts          # ESLint check
npm run fix:ts           # ESLint auto-fix
npm run lint:md          # Remark Markdown lint
npm run format:md        # Remark Markdown auto-format
docker build -t coffee-mate-mcp .  # Build Docker image
```

After code changes, always run `npm run build` before testing the MCP server. When running inside Docker Compose (via `first-n8n`), use `--build` flag to pick up source changes.

## Conventions

- **ES Modules**: Project uses `"type": "module"` — use `import`/`export`, not `require`
- **Effect-TS core**: `Effect.Service` for DI tags, `Layer` for composition, `Data.TaggedError` for typed errors, `Config` for environment-sourced configuration, `ManagedRuntime` to bridge Effect services into MCP tool callbacks via `runtime.runPromise()`
- **Module-service pattern**: Each MCP tool gets its own folder under `module/` within its domain. Service files (`*.service.ts`) contain both business logic and `registerXxxTool()` wiring. Schema files (`*.schema.ts`) define Effect Schema inputs and export StandardSchema adapters. Specs are co-located alongside implementation files
- **Domain registration**: Domain barrels (`domain.ts`) compose service `Layer`s and export a `registerXxxTools()` function. `src/app/main.ts` calls these registration functions during startup
- **Tool registration**: Use `server.registerTool(name, config, handler)` inside `registerXxxTool()` functions in `*.service.ts` files — the older `server.tool()` is deprecated
- **Input validation**: Use Effect Schema in `*.schema.ts` files. Each schema file exports the Effect Schema, a JSON Schema derivation via `JSONSchema.make()`, and a StandardSchema adapter via `toStandardSchema()`. The adapter is referenced by tool `inputSchema`
- **Standard Schema bridge**: `toStandardSchema()` in `server/standard-schema-bridge.ts` adapts Effect Schema to the `StandardSchemaWithJSON` interface required by MCP SDK's `registerTool()`
- **Error handling**: Domain errors extend `Data.TaggedError` with a unique `_tag` string — enables exhaustive `Effect.catchTag` matching without `instanceof` checks. Field names must not shadow `Error.name` (e.g., use `coffeeName` instead of `name`)
- **Strict TypeScript**: `strict: true` is enabled — no implicit `any`, null checks required
- **Session management**: Each `POST /mcp` initialize request creates a new `NodeStreamableHTTPServerTransport` and `McpServer` instance; subsequent requests reuse the transport via the `Mcp-Session-Id` header. Sessions are tracked in an Effect `Ref` holding a transport map
- **Port configuration**: `PORT` env var controls HTTP server port (default `3001`)
- **Health endpoint**: `GET /health` returns `{ status: "ok" }` — used by Docker healthcheck
- **Test framework**: Vitest with co-located `*.spec.ts` files for unit tests, excluded from TypeScript build via `tsconfig.json`
