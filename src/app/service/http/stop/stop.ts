/**
 * Implementation of {@link HttpService.stop}.
 *
 * @module
 */
import { Effect, Ref } from "effect";
import { ServerRefTag } from "../shared/type/server-ref/server-ref.tag.js";

/**
 * Closes the bound TCP server (if any) and clears the {@link ServerRefTag}.
 */
export const stop = () =>
	Effect.gen(function* () {
		const serverRef = yield* ServerRefTag;
		const httpServer = yield* Ref.get(serverRef);
		if (!httpServer) return;

		yield* Effect.async<void>((resume) => {
			httpServer.close(() => resume(Effect.void));
		});
		yield* Ref.set(serverRef, null);
	});
