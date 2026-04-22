/**
 * Implementation of {@link McpService.registerCoffeeTools}.
 *
 * @remarks
 * Owns the metadata, optional input-schema reference, and registration
 * loop for every coffee tool.  Builds a list of descriptor entries by
 * pairing each module-scoped {@link ToolDescriptor} with the matching
 * executor on the resolved {@link CoffeeDomain} service, then calls
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
	StandardSchemaWithJSON,
} from "@modelcontextprotocol/server";
import { CoffeeDomain } from "../../coffee/coffee.service.js";
import { GetACoffeeInputStandard } from "../../coffee/get-a-coffee/get-a-coffee.schema.js";
import { McpRuntimeTag } from "../shared/type/mcp-runtime/mcp-runtime.tag.js";

/**
 * MCP tool handler return shape used to constrain executor types
 * across the iteration loop.
 *
 * @internal
 */
interface ToolResponse {
	readonly [key: string]: unknown;
	readonly content: { type: "text"; text: string }[];
}

/**
 * Bare executor signature exposed by every {@link CoffeeDomain} tool
 * property.
 *
 * @internal
 */
type Executor = (args: unknown) => Effect.Effect<ToolResponse>;

/**
 * Per-tool registration descriptor — pairs static metadata with the
 * resolved domain executor and an optional standard-schema input.
 *
 * @internal
 */
interface ToolDescriptor {
	readonly metaData: { readonly name: string; readonly description: string };
	readonly execute: Executor;
	readonly inputSchema?: StandardSchemaWithJSON<unknown, unknown>;
}

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
 * Yields {@link CoffeeDomain} and {@link McpRuntimeTag} from the
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
		const domain = yield* CoffeeDomain;
		const runtime = yield* McpRuntimeTag;

		const descriptors: readonly ToolDescriptor[] = [
			{
				metaData: getCoffeesMetaData,
				execute: domain.getCoffees,
			},
			{
				metaData: getACoffeeMetaData,
				execute: domain.getACoffee,
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
