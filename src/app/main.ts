import { createServerConfig } from "./config/mcp-server/mcp-server.config.js";
import { createMcpServer } from "./server/mcp-server/mcp-server.js";
import { startHttpServer } from "./transport/http/http.js";
import { startStdioServer } from "./transport/stdio/stdio.js";

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
