/**
 * Internal {@link Context.Tag} that exposes the {@link ManagedRuntime}
 * used to bridge Effect services into MCP tool handler callbacks.
 *
 * @remarks
 * The tag is provided by `mcp.ts` via an internal {@link Layer} so
 * that `setSession` (via the `registerCoffeeTools` effect) can yield
 * the runtime and bridge MCP tool callbacks back into Effect.
 *
 * The service slot is typed as
 * `ManagedRuntime.ManagedRuntime<CoffeeService, unknown>` to match the
 * signature accepted by the registration loop in
 * `service/mcp/register-coffee-tools/`.
 *
 * @module
 */
import { Context, type ManagedRuntime } from "effect";
import type { CoffeeService } from "../../../../coffee/coffee.service.js";

/**
 * Effect tag whose service value is the {@link ManagedRuntime}
 * providing {@link CoffeeService} for tool handler execution.
 */
export class McpRuntimeTag extends Context.Tag("McpManagedRuntime")<
	McpRuntimeTag,
	ManagedRuntime.ManagedRuntime<CoffeeService, unknown>
>() { }
