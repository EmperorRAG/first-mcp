/**
 * Repository — generic data-access {@link Context.Tag} consumed by
 * coffee domain services.
 *
 * @remarks
 * Defines the {@link RepositoryTag} `Context.Tag` whose service value
 * exposes the data-access methods used by the coffee domain
 * (`findAll`, `findByName`).  Implementations live alongside their
 * domain (e.g. the in-memory implementation
 * `InMemoryCoffeeRepositoryLive` lives under
 * `service/coffee/shared/repository/coffee/repository.live.ts`).
 *
 * Consumers obtain the service through `yield* RepositoryTag` inside
 * an `Effect.gen` block; tests provide an alternative {@link Layer}
 * implementing the same shape.
 *
 * @module
 */
import { Context, type Effect, type Option } from "effect";
import type { Coffee } from "../service/coffee/shared/type/coffee/coffee.type.js";

/**
 * Effect {@link Context.Tag} for the data-access repository.
 *
 * @remarks
 * The service value carries two methods:
 *
 * - **`findAll`** — Function that takes an unused `_args` argument
 *   and returns an Effect resolving to the full list of
 *   {@link Coffee} entries.
 * - **`findByName`** — Function that takes a name and returns an
 *   Effect resolving to `Option.Some<Coffee>` on hit and
 *   `Option.None` on miss.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { RepositoryTag } from "./repository.js";
 *
 * const program = Effect.gen(function* () {
 *   const repo = yield* RepositoryTag;
 *   return yield* repo.findAll(undefined);
 * });
 * ```
 */
export class RepositoryTag extends Context.Tag("Repository")<
	RepositoryTag,
	{
		readonly findAll: (
			_args: unknown,
		) => Effect.Effect<readonly Coffee[]>;
		readonly findByName: (
			name: string,
		) => Effect.Effect<Option.Option<Coffee>>;
	}
>() { }
