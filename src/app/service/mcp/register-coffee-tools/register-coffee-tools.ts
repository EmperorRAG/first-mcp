/**
 * Standalone effect that registers the active coffee tools on a given
 * MCP server, used by `setSession`.
 *
 * @remarks
 * Owns the metadata, optional input-schema reference, and registration
 * loop for every coffee tool.  Builds a list of descriptor entries by
 * pairing each module-scoped metadata constant with the matching
 * executor on the resolved {@link CoffeeService} service, then calls
 * `server.registerTool` for each entry whose `metaData.name` appears
 * in the active-tools record.
 *
 * Handlers bridge the SDK's async callback contract to Effect by
 * calling `runtime.runPromise(...)` on the {@link ManagedRuntime}
 * yielded from {@link McpRuntimeTag}.
 *
 * @module
 */
import { Effect } from "effect";
import type {
	McpServer,
} from "@modelcontextprotocol/server";
import { CoffeeService } from "../../coffee/coffee.service.js";
import { GetACoffeeInputStandard } from "../../coffee/get-a-coffee/get-a-coffee.schema.js";
import { McpRuntimeTag } from "../shared/type/mcp-runtime/mcp-runtime.tag.js";

/**
 * Static metadata for the `get-coffees` tool.
 *
 * @internal
 */
const getCoffeesMetaData = {
	name: "get-coffees" as const,
	description: "Get a list of all coffees" as const,
};

/**
 * Static metadata for the `get-a-coffee` tool.
 *
 * @internal
 */
const getACoffeeMetaData = {
	name: "get-a-coffee" as const,
	description:
		"Retrieve the data for a specific coffee based on its name" as const,
};

/**
 * Registers active coffee tools on the given MCP server.
 *
 * @remarks
 * Yields {@link CoffeeService} and {@link McpRuntimeTag} from the
 * Effect context.  Builds a descriptor list pairing each metadata
 * entry with its matching executor on the resolved domain, then
 * calls `server.registerTool` for each entry whose `metaData.name`
 * appears in the active-tools record.  Each registered handler
 * delegates to `runtime.runPromise(execute(args))`.
 *
 * @param server - The MCP server to register tools on.
 * @param activeTools - Record of tool names mapped to active status.
 */
export const registerCoffeeTools = (
	server: McpServer,
	activeTools: Record<string, boolean>,
) =>
	Effect.gen(function* () {
		const service = yield* CoffeeService;
		const runtime = yield* McpRuntimeTag;

		const descriptors = [
			{
				metaData: getCoffeesMetaData,
				execute: service.getCoffees,
			},
			{
				metaData: getACoffeeMetaData,
				execute: service.getACoffee,
				inputSchema: GetACoffeeInputStandard,
			},
		];

		for (const descriptor of descriptors) {
			if (!activeTools[descriptor.metaData.name]) continue;
			server.registerTool(
				descriptor.metaData.name,
				{
					description: descriptor.metaData.description,
					...(descriptor.inputSchema != null
						? { inputSchema: descriptor.inputSchema }
						: {}),
				},
				async (args: unknown) =>
					runtime.runPromise(descriptor.execute(args)),
			);
		}
	});
