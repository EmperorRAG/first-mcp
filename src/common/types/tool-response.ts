export interface ToolTextResponse {
	[key: string]: unknown;
	content: Array<{ type: "text"; text: string }>;
}
