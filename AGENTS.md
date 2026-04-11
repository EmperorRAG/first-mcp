# Project Guidelines

## Architecture

MCP (Model Context Protocol) server with dual transport using a domain-driven module-service architecture. TypeScript source in `src/` compiles to `build/`. Entry point at `src/main.ts`.

### Module-Service Structure

```plaintext
src/
├── main.ts                             — entry point (--stdio flag selects transport)
├── server/
│   └── server.ts                       — createServer() factory, registers domains
├── config/
│   └── server/
│       └── server.config.ts            — PORT, server name/version
├── transport/
│   ├── http/
│   │   └── http.ts                     — Express Streamable HTTP transport
│   └── stdio/
│       └── stdio.ts                    — Stdio transport for VS Code
├── common/types/
│   └── tool-response/
│       └── tool-response.ts            — shared ToolTextResponse type
└── app/
    └── coffee/                         — domain
        ├── coffee.domain.ts            — domain barrel (registers all tool modules)
        ├── shared/
        │   ├── coffee.types.ts         — Coffee interface
        │   └── repository/
        │       ├── coffee.repository.ts      — CoffeeRepository interface + InMemory impl
        │       └── coffee.repository.spec.ts
        ├── get-coffees/                — module-service per tool
        │   ├── module/get-coffees.module.ts
        │   ├── tool/get-coffees.tool.ts + .spec.ts
        │   ├── controller/get-coffees.controller.ts + .spec.ts
        │   └── service/get-coffees.service.ts + .spec.ts
        └── get-a-coffee/
            ├── module/get-a-coffee.module.ts
            ├── tool/get-a-coffee.tool.ts + .spec.ts
            ├── controller/get-a-coffee.controller.ts + .spec.ts
            ├── service/get-a-coffee.service.ts + .spec.ts
            └── dto/get-a-coffee.dto.ts
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Tool** (`*.tool.ts`) | MCP `registerTool()` wiring — name, description, inputSchema. Thin delegate to controller |
| **Controller** (`*.controller.ts`) | Input validation (Zod via DTOs), response formatting, error shaping. Protocol-agnostic |
| **Service** (`*.service.ts`) | Business logic. Delegates to repository |
| **Repository** (`*.repository.ts`) | Data access interface. `InMemory*` impl for now (database-ready interface) |
| **DTO** (`*.dto.ts`) | Zod input/output schemas |
| **Types** (`*.types.ts`) | Domain interfaces and types |
| **Module** (`*.module.ts`) | Wires repo → service → controller → tool |
| **Domain** (`*.domain.ts`) | Creates shared resources (repo), registers all tool modules |

### Transport Modes

- **Streamable HTTP (default)**: Express HTTP server exposing `POST /mcp`, `GET /mcp` (SSE backward compat), `DELETE /mcp` (session termination), and `GET /health`. Uses `NodeStreamableHTTPServerTransport` with stateful sessions (`Mcp-Session-Id` header). `createMcpExpressApp()` provides DNS rebinding protection. Used for Docker and network-based clients.
- **stdio (`--stdio` flag)**: `StdioServerTransport` for local VS Code MCP integration via `.vscode/mcp.json`.

## Build and Test

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript (src/ → build/)
npm test                 # Run all tests (Vitest — unit + Gherkin)
npm run test:unit        # Unit tests only (*.spec.ts)
npm run test:component   # Component Gherkin features
npm run test:service     # Service Gherkin features
npm run test:domain      # Domain Gherkin features (integration + E2E)
npm run test:feature     # All Gherkin features (component + service + domain)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
docker build -t coffee-mate-mcp .  # Build Docker image
```

After code changes, always run `npm run build` before testing the MCP server. When running inside Docker Compose (via `first-n8n`), use `--build` flag to pick up source changes.

### Gherkin / BDD Tests

Feature files live in `docs/features/` organized by scope. Step definitions live alongside source in `src/` under `step/` subfolders. [quickpickle](https://github.com/dnotes/quickpickle) integrates Gherkin with Vitest.

#### Feature File Locations

```plaintext
docs/features/
├── coffee/
│   ├── components/coffee-repository/   — component-level (repository isolation)
│   │   ├── coffee-repository.unit.feature
│   │   ├── coffee-repository.integration.feature
│   │   └── coffee-repository.contract.feature
│   ├── services/
│   │   ├── get-coffees/                — service-level (tool → controller → service → repo)
│   │   │   ├── get-coffees.integration.feature
│   │   │   └── get-coffees.contract.feature
│   │   └── get-a-coffee/
│   │       ├── get-a-coffee.integration.feature
│   │       └── get-a-coffee.contract.feature
│   ├── coffee-domain.integration.feature  — domain-level (cross-tool registration)
│   ├── coffee-domain.contract.feature     — domain-level (tool metadata contracts)
│   └── coffee-domain.e2e.feature          — E2E (MCP client + HTTP transport)
├── server/
│   └── components/
│       ├── server-config/              — server config module
│       │   ├── server-config.unit.feature
│       │   └── server-config.contract.feature
│       └── server-factory/             — createServer factory
│           ├── server-factory.unit.feature
│           └── server-factory.contract.feature
└── transport/
    ├── components/
    │   └── stdio-transport/            — stdio transport module
    │       └── stdio-transport.unit.feature
    └── services/
        └── http-transport/             — HTTP transport integration
            ├── http-transport.integration.feature
            └── http-transport.contract.feature
```

#### Step Definition Locations

```plaintext
src/app/coffee/
├── shared/repository/step/coffee-repository.steps.ts  — component steps
├── get-coffees/step/get-coffees.steps.ts              — service steps
├── get-a-coffee/step/get-a-coffee.steps.ts            — service steps
└── step/coffee-domain.steps.ts                        — domain + E2E steps
src/config/server/step/server-config.steps.ts          — server config component steps
src/server/step/server-factory.steps.ts                — server factory component steps
src/transport/http/step/http-transport.steps.ts         — HTTP transport service steps
src/transport/stdio/step/stdio-transport.steps.ts       — stdio transport component steps
```

#### Vitest Projects

| Project | Scope | Includes |
|---|---|---|
| `unit` | Unit tests | `src/**/*.spec.ts` |
| `component` | Component features | `docs/features/**/components/**/*.feature` |
| `service` | Service features | `docs/features/**/services/**/*.feature` |
| `domain` | Domain + E2E features | `docs/features/coffee/*.feature` |

#### E2E Tags

- `@in-process` — Uses `StreamableHTTPClientTransport` against loopback server
- `@http` — Uses raw `fetch` against loopback server (health, session termination)

## Conventions

- **ES Modules**: Project uses `"type": "module"` — use `import`/`export`, not `require`
- **Module-service pattern**: Each MCP tool gets its own module-service folder under its domain with singular-named layer subfolders (`tool/`, `controller/`, `service/`, `dto/`, `module/`). Specs are co-located alongside implementation files
- **Domain registration**: Domain barrels (`*.domain.ts`) create shared resources and register tool modules. `src/server/server.ts` registers domains
- **Tool registration**: Use `server.registerTool(name, config, handler)` inside `*.tool.ts` files — the older `server.tool()` is deprecated
- **Input validation**: Use Zod schemas in `*.dto.ts` files, referenced by tool `inputSchema` and validated in controllers
- **Tool responses**: Controllers return `ToolTextResponse` type: `{ content: [{ type: "text", text: string }] }`
- **Strict TypeScript**: `strict: true` is enabled — no implicit `any`, null checks required
- **Zod import**: Use `import * as z from "zod/v4"` (SDK v2 convention)
- **Body parsing**: Always pass `req.body` as the third argument to `transport.handleRequest(req, res, req.body)` — `express.json()` consumes the stream, so the SDK cannot re-read it
- **Session management**: Each `POST /mcp` initialize request creates a new `NodeStreamableHTTPServerTransport` and `McpServer` instance; subsequent requests reuse the transport via the `Mcp-Session-Id` header
- **Port configuration**: `PORT` env var controls HTTP server port (default `3001`)
- **Health endpoint**: `GET /health` returns `{ status: "ok" }` — used by Docker healthcheck
- **Test framework**: Vitest with co-located `*.spec.ts` files for unit tests. Gherkin `*.feature` files in `docs/features/` with co-located `*.steps.ts` in `src/` under `step/` subfolders. Both are excluded from TypeScript build via `tsconfig.json`
- **Gherkin plugin**: quickpickle — each Vitest project that runs `.feature` files must include `plugins: [quickpickle()]` and reference step files via `setupFiles`
- **Step definitions**: Use `Given`/`When`/`Then` from `"quickpickle"`. World state is passed as the first argument. Step files use `.steps.ts` extension
