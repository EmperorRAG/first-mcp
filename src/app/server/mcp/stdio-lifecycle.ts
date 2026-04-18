/**
 * Stdio server lifecycle — creates a single {@link McpServer} with a
 * {@link StdioServerTransport} for local VS Code MCP integration.
 *
 * @remarks
 * Unlike HTTP mode, stdio requires no session management, routing, or
 * body parsing.  The SDK reads directly from `stdin` and writes to
 * `stdout` after {@link McpServer.connect} is called.
 *
 * @module
 */
import { StdioServerTransport } from "@modelcontextprotocol/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { Effect, type ManagedRuntime } from "effect";

/**
 * Starts the stdio transport by creating a single {@link McpServer}
 * and connecting it to a {@link StdioServerTransport}.
 *
 * @remarks
 * Execution steps:
 *
 * 1. Creates a {@link StdioServerTransport} instance.
 * 2. Calls `createMcpServerFn(runtime)` to obtain a configured
 *    {@link McpServer} with all tools registered.
 * 3. Connects the server to the transport via
 *    {@link McpServer.connect}.
 * 4. Logs a startup message.
 *
 * @param runtime - {@link ManagedRuntime} for tool handler resolution.
 * @param createMcpServerFn - Factory that creates and configures an
 *        {@link McpServer} with registered tools.
 * @returns An {@link Effect.Effect} that resolves once the server is
 *          connected to stdio.
 */
export const startStdio = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	runtime: ManagedRuntime.ManagedRuntime<any, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createMcpServerFn: (runtime: ManagedRuntime.ManagedRuntime<any, unknown>) => McpServer,
): Effect.Effect<void> =>
	Effect.gen(function* () {
		const sdkTransport = new StdioServerTransport();
		const server = createMcpServerFn(runtime);
		yield* Effect.promise(() => server.connect(sdkTransport));
		yield* Effect.logInfo("MCP Server running on stdio");
	});
