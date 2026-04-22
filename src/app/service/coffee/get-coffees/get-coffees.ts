/**
 * Get-coffees service — Effect function that yields the
 * {@link CoffeeRepository} dependency and returns an MCP-shaped
 * response listing every coffee.
 *
 * @remarks
 * Exports a single function {@link getCoffees} whose
 * return type is inferred by Effect.  The function ignores its
 * `args` parameter, calls `repo.findAll`, JSON-serialises the result,
 * and wraps the value in the standard MCP `{ content: [...] }`
 * envelope.  Tool metadata (`metaData`, `inputSchema`) lives in
 * `coffee.service.ts`, not here.
 *
 * @module
 */
import { Effect } from "effect";
import { CoffeeRepository } from "../shared/repository/coffee/repository.js";

/**
 * Returns every coffee in the repository as an MCP-shaped response.
 *
 * @remarks
 * Yields {@link CoffeeRepository} from the Effect context, calls
 * `repo.findAll`, and wraps the JSON-serialised list in the MCP
 * `{ content: [{ type: "text", text }] }` envelope.  Wrapped in
 * {@link Effect.withSpan} for observability.
 *
 * @param _args - Unused — the tool takes no arguments.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCoffees = (_args: unknown) =>
	Effect.gen(function* () {
		const repo = yield* CoffeeRepository;
		const coffees = yield* repo.findAll;
		return {
			content: [{ type: "text" as const, text: JSON.stringify(coffees) }],
		};
	}).pipe(Effect.withSpan("getCoffees.executeFormatted"));
