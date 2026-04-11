import { createServer } from "./server.js";
import { startHttpServer } from "./transport/http.js";
import { startStdioServer } from "./transport/stdio.js";

async function main() {
	const useStdio = process.argv.includes("--stdio");

	if (useStdio) {
		const server = createServer();
		await startStdioServer(server);
	} else {
		startHttpServer(createServer);
	}
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
