/**
 * Get-coffees service — Effect function that yields the
 * {@link RepositoryTag} dependency and returns an MCP-shaped
 * response listing every coffee.
 *
 * @remarks
 * Exports a single function {@link getCoffees} whose
 * return type is inferred by Effect.  The function forwards its
 * `_args` parameter to `repo.findAll`, JSON-serialises the result,
 * and wraps the value in the standard MCP `{ content: [...] }`
 * envelope.  Tool metadata (`metaData`, `inputSchema`) lives in
 * `coffee.service.ts`, not here.
 *
 * @module
 */
import { Effect } from "effect";
import { RepositoryTag } from "../../../repository/repository.js";

/**
 * Returns every coffee in the repository as an MCP-shaped response.
 *
 * @remarks
 * Yields {@link RepositoryTag} from the Effect context, calls
 * `repo.findAll(_args)`, and wraps the JSON-serialised list in the
 * MCP `{ content: [{ type: "text", text }] }` envelope.  Wrapped in
 * {@link Effect.withSpan} for observability.
 *
 * @param _args - Forwarded to `repo.findAll`; the tool itself takes
 * no arguments.
 */
export const getCoffees = (_args: unknown) =>
	Effect.gen(function* () {
		const repo = yield* RepositoryTag;
		const coffees = yield* repo.findAll(_args);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(coffees) }],
		};
	}).pipe(Effect.withSpan("getCoffees.executeFormatted"));
