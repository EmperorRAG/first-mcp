# Project Guidelines

## Architecture

MCP (Model Context Protocol) server with dual transport using an Effect-TS domain-service architecture. TypeScript source in `src/` compiles to `build/`. Entry point at `src/app/main.ts`.

### Source Structure

```plaintext
src/app/
├── main.ts                             — entry point (--stdio CLI override, layer composition)
├── config/
│   └── app/
│       ├── app-config.ts               — AppConfig Effect Service (PORT, server name/version, mode, active tools, allowed hosts)
│       └── app-config.spec.ts
├── server/                             — listener layer (server lifecycle + request dispatch)
│   ├── server.ts                       — Listener Context.Tag + ListenerShape interface
│   ├── http/
│   │   ├── http-listener.ts            — HttpListener tag + HttpListenerLive Layer (node:http server)
│   │   ├── body-parser.ts              — parseBody() — reads IncomingMessage stream as JSON Effect
│   │   └── body-parser.spec.ts
│   ├── stdio/
│   │   └── stdio-listener.ts           — StdioListener tag + StdioListenerLive Layer
│   └── mcp/                            — MCP session manager
│       ├── mcp-server.ts               — McpServerService Effect.Service (session CRUD)
│       ├── types.ts                    — SessionEntry + McpServerServiceShape contract
│       ├── types.spec.ts
│       ├── errors.ts                   — SessionNotFoundError (Data.TaggedError)
│       ├── registerable-tool.ts        — RegisterableTool interface for auto-registration
│       └── registerable-tool.spec.ts
├── router/                             — routing layer (McpRequest → RouteAction)
│   ├── router.ts                       — Router Context.Tag + RouterShape + RouteAction union
│   ├── http/
│   │   ├── http-router.ts              — HttpRouterLive Layer (DNS rebinding guard, path routing)
│   │   └── http-router.spec.ts
│   └── stdio/
│       ├── stdio-router.ts             — StdioRouterLive Layer (always "mcp-message")
│       └── stdio-router.spec.ts
├── transport/                          — transport layer (wire-format adapter)
│   ├── transport.ts                    — Transport Context.Tag + TransportShape interface
│   ├── mcp-request.ts                  — McpRequest Schema.TaggedClass DTO (HTTP + stdio decode)
│   ├── mcp-request.spec.ts
│   ├── mcp-response.ts                — McpResponse Schema.TaggedClass DTO (HTTP encode + CORS)
│   ├── mcp-response.spec.ts
│   ├── http/
│   │   ├── http-transport.ts           — HttpTransportLive Layer (parse/respond/handleMcp)
│   │   └── http-transport.spec.ts
│   └── stdio/
│       ├── stdio.ts                    — StdioTransportLive Layer (parse only; SDK handles I/O)
│       └── stdio.spec.ts
├── schema/
│   └── shared/
│       └── standard-schema-bridge.ts   — toStandardSchema() adapter (Effect Schema → MCP SDK)
├── service/
│   └── coffee/                         — coffee domain
│       ├── domain.ts                   — CoffeeDomain Effect.Service (barrel + registerCoffeeTools)
│       ├── domain.spec.ts
│       ├── errors.ts                   — CoffeeNotFoundError (Data.TaggedError)
│       ├── errors.spec.ts
│       ├── type/                       — domain entity schemas (one folder per field)
│       │   ├── coffee/
│       │   │   ├── coffee.type.ts      — CoffeeSchema (Schema.Struct) + Coffee type alias
│       │   │   └── coffee.type.spec.ts
│       │   ├── coffee-id/
│       │   │   ├── coffee-id.type.ts
│       │   │   └── coffee-id.type.spec.ts
│       │   ├── coffee-name/
│       │   │   ├── coffee-name.type.ts
│       │   │   └── coffee-name.type.spec.ts
│       │   ├── coffee-price/
│       │   │   ├── coffee-price.type.ts
│       │   │   └── coffee-price.type.spec.ts
│       │   ├── coffee-size/
│       │   │   ├── coffee-size.type.ts
│       │   │   └── coffee-size.type.spec.ts
│       │   ├── coffee-iced/
│       │   │   ├── coffee-iced.type.ts
│       │   │   └── coffee-iced.type.spec.ts
│       │   └── coffee-caffeine-content/
│       │       ├── coffee-caffeine-content.type.ts
│       │       └── coffee-caffeine-content.type.spec.ts
│       ├── repository/
│       │   ├── coffee-repository.ts    — CoffeeRepository tag + InMemory impl
│       │   └── coffee-repository.spec.ts
│       └── module/
│           ├── get-coffees/
│           │   ├── get-coffees.service.ts      — GetCoffeesService + tool wiring
│           │   └── get-coffees.service.spec.ts
│           └── get-a-coffee/
│               ├── get-a-coffee.service.ts     — GetACoffeeService + tool wiring
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

| Layer                                                               | Responsibility                                                                                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Listener** (`server.ts`, `http-listener.ts`, `stdio-listener.ts`) | Server lifecycle (bind/close), per-request dispatch through Transport → Router → McpServerService                                              |
| **McpServerService** (`mcp/mcp-server.ts`)                          | Session CRUD (create, get, delete, stop). Creates McpServer + SDK transport per session, registers domain tools, manages session map via `Ref` |
| **Router** (`router.ts`, `http-router.ts`, `stdio-router.ts`)       | Maps `McpRequest` → `RouteAction` union. DNS rebinding guard in HTTP router; stdio always returns `"mcp-message"`                              |
| **Transport** (`transport.ts`, `http-transport.ts`, `stdio.ts`)     | Wire-format adapter: `parse` (raw → `McpRequest`), `respond` (`McpResponse` → wire), `handleMcp` (delegate to SDK transport)                   |
| **Domain** (`domain.ts`)                                            | Composes service Layers, provides repository, exports `registerCoffeeTools()`                                                                  |
| **Service** (`*.service.ts`)                                        | Business logic + MCP `registerTool()` wiring via `registerXxxTool()`. Delegates to repository                                                  |
| **Schema** (`*.schema.ts`)                                          | Effect Schema input definitions, JSON Schema derivation, StandardSchema adapter                                                                |
| **Repository** (`*.repository.ts`)                                  | Data access interface. `InMemory*` impl for now (database-ready interface)                                                                     |
| **Types** (`*.type.ts`)                                             | Domain entities as Effect `Schema.Struct` definitions (one folder per field under `type/`)                                                     |
| **Errors** (`errors.ts`)                                            | Domain errors as `Data.TaggedError` — enables `Effect.catchTag` matching                                                                       |
| **Standard Schema Bridge** (`standard-schema-bridge.ts`)            | Adapts Effect Schema to `StandardSchemaWithJSON` for MCP SDK                                                                                   |

### Transport Modes

- **Streamable HTTP (default)**: Raw Node.js HTTP server exposing `POST /mcp`, `GET /mcp` (SSE backward compat), `DELETE /mcp` (session termination), and `GET /health`. Request flow: `HttpListener.start()` → per-request `parseBody()` → `Transport.parse()` → `Router.resolve()` → switch on `RouteAction` → `McpServerService` session CRUD. Uses `NodeStreamableHTTPServerTransport` with stateful sessions (`Mcp-Session-Id` header). DNS rebinding protection in `HttpRouterLive` validates `Host` header against loopback addresses and any additional hostnames in `ALLOWED_HOSTS`. Sessions tracked in an Effect `Ref` holding a transport map. CORS headers added manually via `McpResponse`. Used for Docker and network-based clients.
- **stdio (`--stdio` flag)**: `StdioListener.start()` creates a single MCP session via `McpServerService.setSession()` with a fixed `"stdio"` session ID. The SDK's `StdioServerTransport` reads directly from `stdin` and writes to `stdout`. No routing, body parsing, or multi-session management. For local VS Code MCP integration via `.vscode/mcp.json`.
- **Selection**: `main.ts` reads `AppConfig.mode` (with `--stdio` CLI override via `resolveTransportMode()`), selects the appropriate `Transport`, `Router`, and `Listener` layers, composes the runtime, and resolves the shared `Listener` tag to call `start()`.

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
- **Standard Schema bridge**: `toStandardSchema()` in `schema/shared/standard-schema-bridge.ts` adapts Effect Schema to the `StandardSchemaWithJSON` interface required by MCP SDK's `registerTool()`
- **Error handling**: Domain errors extend `Data.TaggedError` with a unique `_tag` string — enables exhaustive `Effect.catchTag` matching without `instanceof` checks. Field names must not shadow `Error.name` (e.g., use `coffeeName` instead of `name`)
- **Strict TypeScript**: `strict: true` is enabled — no implicit `any`, null checks required
- **Listener abstraction**: `Listener` Context.Tag in `server/server.ts` defines the shared `start()`/`stop()` interface. `HttpListenerLive` and `StdioListenerLive` satisfy it. `main.ts` resolves the tag via `Layer.effect` based on the transport mode
- **Router abstraction**: `Router` Context.Tag in `router/router.ts` defines `resolve(McpRequest) → RouteAction`. `HttpRouterLive` performs DNS rebinding guard + path/method routing; depends on `AppConfig` for `ALLOWED_HOSTS`. `StdioRouterLive` always returns `"mcp-message"`
- **Transport abstraction**: `Transport` Context.Tag in `transport/transport.ts` defines `parse`/`respond`/`handleMcp`. `HttpTransportLive` delegates to `McpRequest`/`McpResponse` DTOs. `StdioTransportLive` is minimal (SDK handles I/O)
- **Session management**: `McpServerService` owns session CRUD via an Effect `Ref` holding a `Map<string, SessionEntry>`. Each `POST /mcp` initialize creates a new `McpServer` + `NodeStreamableHTTPServerTransport`; subsequent requests reuse via the `Mcp-Session-Id` header. `SessionNotFoundError` (`Data.TaggedError`) is raised when a session ID is not found. HTTP listener uses `Effect.either` for graceful fallthrough to the initialize check on `mcp-message`
- **Allowed hosts**: `ALLOWED_HOSTS` env var (comma-separated, case-insensitive) adds hostnames to the DNS rebinding allowlist beyond the default loopback addresses — required for remote deployments (e.g., Azure Container Apps)
- **Port configuration**: `PORT` env var controls HTTP server port (default `3001`)
- **Health endpoint**: `GET /health` returns `{ status: "ok" }` — used by Docker healthcheck
- **Docker**: Multi-stage build (`builder` + `runner`). Non-root `app` user. `HEALTHCHECK` via `wget` against `/health`. `NODE_ENV=production`
- **CI/CD**: GitHub Actions workflow (`deploy.yml`). `ci` job runs build → lint → test on all branches and PRs. `deploy` job (ACR → Azure Container Apps) gated to `main` push only
- **Test framework**: Vitest with co-located `*.spec.ts` files for unit tests, excluded from TypeScript build via `tsconfig.json`
