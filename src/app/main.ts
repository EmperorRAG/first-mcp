import { createServerConfig } from "./config/mcp-server/mcp-server.config.js";
import { createMcpServer } from "./server/mcp-server/mcp-server.js";
import { startHttpServer } from "./transport/http/http.js";
import { startStdioServer } from "./transport/stdio/stdio.js";

/**
 * Application entry point.
 *
 * @remarks
 * Selects the transport mode based on command-line arguments:
 * - `--stdio` flag: starts the stdio transport for local VS Code integration
 * - Default: starts the Streamable HTTP transport for network clients
 */
async function main() {
	const config = createServerConfig();
	const useStdio = process.argv.includes("--stdio");

	if (useStdio) {
		const server = createMcpServer(config);
		await startStdioServer(server);
	} else {
		startHttpServer(() => createMcpServer(config), config.port);
	}
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
