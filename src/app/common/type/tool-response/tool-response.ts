export interface ToolTextResponse {
	[key: string]: unknown;
	content: { type: "text"; text: string }[];
}
