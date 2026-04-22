/**
 * Implementation of {@link McpServiceInterface.start}.
 *
 * @remarks
 * Initialisation of the session manager is performed in the
 * `Effect.Service` `scoped` factory in `mcp.ts` (sessions ref,
 * managed runtime, finalisers). This effect is therefore a no-op
 * exposed only to satisfy the contract.
 *
 * @module
 */
import { Effect } from "effect";

/**
 * No-op start effect for the MCP session manager.
 */
export const start = () => Effect.void;
