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
├── service/
│   ├── coffee/                         — coffee domain (see below)
│   ├── mcp/                            — MCP session manager
│   │   ├── mcp.service.ts              — McpService Effect.Service (session CRUD; setSession/getSession/deleteSession)
│   │   └── shared/
│   │       ├── error/session-not-found/   — SessionNotFoundError (Data.TaggedError)
│   │       └── type/                       — SessionEntry, RegisterableTool
│   ├── http/                           — HTTP listener (Effect.Service)
│   │   ├── http.service.ts             — HttpService Effect.Service (composes start/stop/port/address)
│   │   ├── parse/parse.ts              — parse(rawHttpInput) → McpRequest
│   │   ├── respond/respond.ts          — respond(req, McpResponse) — writes status/headers/body
│   │   ├── handle-mcp/handle-mcp.ts    — handleMcp(req, sdkTransport) — delegates to SDK
│   │   ├── resolve/resolve.ts          — resolve(McpRequest) → RouteAction (DNS rebinding guard + path/method)
│   │   ├── body-parser/body-parser.ts  — parseBody(IncomingMessage) — JSON Effect
│   │   ├── handle-request/             — per-request dispatch loop
│   │   │   ├── handle-request.ts       — switch on RouteAction + 400/500 fallback
│   │   │   ├── handle-mcp-message/     — POST /mcp (existing session, initialize, or 400)
│   │   │   ├── handle-mcp-sse/         — GET /mcp (SSE backward compat)
│   │   │   ├── handle-session-terminate/ — DELETE /mcp
│   │   │   ├── handle-health-check/    — GET /health
│   │   │   ├── handle-cors-preflight/  — OPTIONS
│   │   │   ├── handle-not-found/       — 404
│   │   │   └── handle-forbidden/       — 403 (DNS rebinding)
│   │   ├── start/start.ts              — binds node:http server, dispatches via Effect.runtime
│   │   ├── stop/stop.ts                — closes server
│   │   ├── port/port.ts, address/address.ts — server.address() accessors
│   │   └── shared/type/server-ref/     — ServerRefTag (Ref<Server | null>)
│   └── stdio/                          — stdio listener (Effect.Service)
│       ├── stdio.service.ts            — StdioService Effect.Service
│       ├── start/start.ts              — creates fixed "stdio" session via McpService.setSession()
│       └── stop/stop.ts
├── schema/
│   ├── request/mcp-request.ts          — McpRequest Schema.TaggedClass DTO (HTTP + stdio decode)
│   ├── response/mcp-response.ts        — McpResponse Schema.TaggedClass DTO (HTTP encode + CORS)
│   └── shared/standard-schema-bridge.ts — toStandardSchema() adapter (Effect Schema → MCP SDK)
│       ├── domain.ts                   — CoffeeService Effect.Service (barrel exposing per-tool executors)
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
│       │   ├── repository.live.ts           — InMemoryCoffeeRepositoryLive Layer (Layer.succeed)
│       │   └── repository.live.spec.ts
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

| Layer                                                                 | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HttpService** (`service/http/http.service.ts`)                      | Effect.Service composing the HTTP listener lifecycle. Allocates `ServerRefTag` (Ref<Server>), provides `start/stop/port/address` by composing per-method effects under `start/`, `stop/`, `port/`, `address/`. Dispatch loop in `handle-request/` switches on the `RouteAction` returned by `resolve/` and delegates to the per-action subfolders (`handle-mcp-message/`, `handle-mcp-sse/`, `handle-session-terminate/`, `handle-health-check/`, `handle-cors-preflight/`, `handle-not-found/`, `handle-forbidden/`) |
| **StdioService** (`service/stdio/stdio.service.ts`)                   | Effect.Service that creates a single fixed `"stdio"` session via `McpService.setSession()`. SDK reads stdin/writes stdout directly                                                                                                                                                                                                                                                                                                                                                                                    |
| **McpService** (`service/mcp/mcp.service.ts`)                         | Session CRUD (`setSession`, `getSession`, `deleteSession`). Creates `McpServer` + SDK transport per session, manages session map via `Ref`                                                                                                                                                                                                                                                                                                                                                                            |
| **HTTP primitives** (`parse/`, `respond/`, `handle-mcp/`, `resolve/`) | Standalone Effect-returning functions (no Tag/Layer) — `parse(raw) → McpRequest`, `respond(req, McpResponse) → void`, `handleMcp(req, sdk) → void`, `resolve(req) → RouteAction`                                                                                                                                                                                                                                                                                                                                      |
| **Domain** (`domain.ts`)                                              | Composes service Layers, provides repository, exposes per-tool executor properties consumed by McpService                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Service** (`*.service.ts`)                                          | Business logic + MCP `registerTool()` wiring via `registerXxxTool()`. Delegates to repository                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Schema** (`*.schema.ts`)                                            | Effect Schema input definitions, JSON Schema derivation, StandardSchema adapter                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Repository** (`repository.ts`, `*.live.ts`)                         | Data access. `RepositoryTag` Context.Tag (top-level shared) + `InMemoryCoffeeRepositoryLive` Layer                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Types** (`*.type.ts`)                                               | Domain entities as Effect `Schema.Struct` definitions (one folder per field under `type/`)                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Errors** (`errors.ts`)                                              | Domain errors as `Data.TaggedError` — enables `Effect.catchTag` matching                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Standard Schema Bridge**                                            | Adapts Effect Schema to `StandardSchemaWithJSON` for MCP SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Transport Modes

- **Streamable HTTP (default)**: Raw Node.js HTTP server exposing `POST /mcp`, `GET /mcp` (SSE backward compat), `DELETE /mcp` (session termination), and `GET /health`. Request flow: `HttpService.start()` → per-request `parseBody()` → `parse()` → `resolve()` → switch on `RouteAction` → per-action handler under `handle-request/` → `McpService` session CRUD. Uses `NodeStreamableHTTPServerTransport` with stateful sessions (`Mcp-Session-Id` header). DNS rebinding protection in `resolve()` validates `Host` header against loopback addresses and any additional hostnames in `ALLOWED_HOSTS`. Sessions tracked in an Effect `Ref` holding a transport map. CORS headers added manually via `McpResponse`. Used for Docker and network-based clients.
- **stdio (`--stdio` flag)**: `StdioService.start()` creates a single MCP session via `McpService.setSession()` with a fixed `"stdio"` session ID. The SDK's `StdioServerTransport` reads directly from `stdin` and writes to `stdout`. No routing, body parsing, or multi-session management. For local VS Code MCP integration via `.vscode/mcp.json`.
- **Selection**: `main.ts` reads `AppConfig.mode` (with `--stdio` CLI override via `resolveTransportMode()`), selects the pre-composed `StdioAppLayer` or `HttpAppLayer` from `layers.ts`, composes the runtime, and yields either `StdioService` or `HttpService` to call `start()`.

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
- **Listener services**: `HttpService` and `StdioService` are both `Effect.Service` definitions exposing `start()`/`stop()` (HTTP also exposes `port()`/`address()`). `main.ts` yields the appropriate service directly — no shared listener tag
- **HTTP route resolution**: Standalone `resolve(McpRequest) → RouteAction` Effect in `service/http/resolve/resolve.ts` performs DNS rebinding guard + path/method routing; depends on `AppConfig` for `ALLOWED_HOSTS`. Stdio has no resolver — the SDK transport is invoked directly
- **HTTP wire-format primitives**: Standalone `parse`, `respond`, `handleMcp` Effect-returning functions in `service/http/{parse,respond,handle-mcp}/` (no Tag/Layer). The per-RouteAction handlers under `service/http/handle-request/` compose them with `McpService` to satisfy each route
- **Session management**: `McpService` owns session CRUD via an Effect `Ref` holding a `Map<string, SessionEntry>`. Each `POST /mcp` initialize creates a new `McpServer` + `NodeStreamableHTTPServerTransport`; subsequent requests reuse via the `Mcp-Session-Id` header. `SessionNotFoundError` (`Data.TaggedError`) is raised when a session ID is not found. The HTTP `handle-mcp-message/` handler uses `Effect.either` for graceful fallthrough to the initialize check
- **Allowed hosts**: `ALLOWED_HOSTS` env var (comma-separated, case-insensitive) adds hostnames to the DNS rebinding allowlist beyond the default loopback addresses — required for remote deployments (e.g., Azure Container Apps)
- **Port configuration**: `PORT` env var controls HTTP server port (default `3001`)
- **Health endpoint**: `GET /health` returns `{ status: "ok" }` — used by Docker healthcheck
- **Docker**: Multi-stage build (`builder` + `runner`). Non-root `app` user. `HEALTHCHECK` via `wget` against `/health`. `NODE_ENV=production`
- **CI/CD**: GitHub Actions workflow (`deploy.yml`). `ci` job runs build → lint → test on all branches and PRs. `deploy` job (ACR → Azure Container Apps) gated to `main` push only
- **Test framework**: Vitest with co-located `*.spec.ts` files for unit tests, excluded from TypeScript build via `tsconfig.json`
