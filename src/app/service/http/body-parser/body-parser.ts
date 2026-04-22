/**
 * HTTP request body parser — reads a Node.js {@link IncomingMessage}
 * stream and yields JSON-parsed content as an Effect.
 *
 * @remarks
 * Bridges Node.js stream callbacks (`data`, `end`, `error`) into the
 * Effect world via {@link Effect.async}.  Used exclusively by the
 * {@link HttpService} to consume the request body before routing.
 *
 * @module
 */
import type { IncomingMessage } from "node:http";
import { Effect } from "effect";

/**
 * Reads the full request body from an {@link IncomingMessage} stream
 * and parses it as JSON, wrapped in an Effect.
 *
 * @remarks
 * Bridges Node.js stream callbacks (`data`, `end`, `error`) into the
 * Effect world via {@link Effect.async}:
 *
 * - On `end` — concatenates chunks, decodes UTF-8, attempts
 *   `JSON.parse`.  Empty body yields `undefined`.
 * - On `error` — fails the effect with the stream error.
 * - On invalid JSON — fails with `Error("Invalid JSON")`.
 *
 * @param req - The incoming HTTP request whose body stream will be
 *        consumed.
 * @returns An {@link Effect.Effect} yielding the parsed JSON value
 *          (or `undefined`), or failing with an `Error`.
 */
export const parseBody = (req: IncomingMessage): Effect.Effect<unknown, Error> =>
	Effect.async<unknown, Error>((resume) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => chunks.push(chunk));
		req.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf8");
			try {
				resume(Effect.succeed(raw.length > 0 ? JSON.parse(raw) : undefined));
			} catch {
				resume(Effect.fail(new Error("Invalid JSON")));
			}
		});
		req.on("error", (err) => resume(Effect.fail(err)));
	});
