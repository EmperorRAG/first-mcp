/**
 * Implementation of {@link HttpService.port}. Returns the bound port
 * after {@link HttpService.start} has resolved.
 *
 * @module
 */
import { Effect, Ref } from "effect";
import { ServerRefTag } from "../shared/type/server-ref/server-ref.tag.js";

/**
 * Returns the bound TCP port; dies if the server is not started or if
 * the underlying address is a Unix socket path.
 */
export const port = () =>
	Effect.gen(function* () {
		const serverRef = yield* ServerRefTag;
		const httpServer = yield* Ref.get(serverRef);
		if (!httpServer)
			return yield* Effect.die(new Error("HTTP server not started"));
		const addr = httpServer.address();
		if (!addr || typeof addr === "string")
			return yield* Effect.die(new Error("Unexpected address format"));
		return addr.port;
	});
