/**
 * Get-a-coffee service — Effect function that yields the
 * {@link RepositoryTag} dependency, decodes its input, looks up
 * a coffee by name, and returns an MCP-shaped response.
 *
 * @remarks
 * Exports a single function {@link getACoffee} whose
 * return type is inferred by Effect.  The function decodes its
 * `args` against {@link GetACoffeeInput}, looks up the coffee via
 * `RepositoryTag.findByName`, and wraps the result in the
 * standard MCP `{ content: [...] }` envelope.  When the coffee is
 * not found, {@link CoffeeNotFoundError} is caught internally and
 * a user-friendly message is returned instead of failing the
 * effect.  Tool metadata (`metaData`, `inputSchema`) lives in
 * `coffee.service.ts`, not here.
 *
 * @module
 */
import { Effect, Option, Schema } from "effect";
import { RepositoryTag } from "../../../repository/repository.js";
import { CoffeeNotFoundError } from "../shared/error/coffee-not-found/coffee-not-found.js";
import { GetACoffeeInput } from "./get-a-coffee.schema.js";

/**
 * Looks up a coffee by name and returns an MCP-shaped response.
 *
 * @remarks
 * Decodes `args` against {@link GetACoffeeInput} via
 * {@link Schema.decodeUnknownSync}, yields {@link RepositoryTag}
 * from the Effect context, calls `repo.findByName`, and wraps the
 * result in the MCP `{ content: [{ type: "text", text }] }`
 * envelope.  When the lookup yields `Option.None`, the function
 * fails with {@link CoffeeNotFoundError}, which is then caught via
 * {@link Effect.catchTag} and replaced with a user-friendly
 * not-found message.  Wrapped in {@link Effect.withSpan} for
 * observability.
 *
 * @param args - Raw input from the MCP SDK; decoded internally.
 */
export const getACoffee = (args: unknown) =>
	Effect.gen(function* () {
		const repo = yield* RepositoryTag;
		const { name } = Schema.decodeUnknownSync(GetACoffeeInput)(args);
		const coffee = yield* Effect.flatMap(
			repo.findByName(name),
			Option.match({
				onNone: () =>
					Effect.fail(new CoffeeNotFoundError({ coffeeName: name })),
				onSome: (c) => Effect.succeed(c),
			}),
		);
		return {
			content: [{ type: "text" as const, text: JSON.stringify(coffee) }],
		};
	}).pipe(
		Effect.catchTag("CoffeeNotFoundError", (err) =>
			Effect.succeed({
				content: [
					{
						type: "text" as const,
						text: `Coffee "${err.coffeeName}" not found`,
					},
				],
			}),
		),
		Effect.withSpan("getACoffee.executeFormatted"),
	);
