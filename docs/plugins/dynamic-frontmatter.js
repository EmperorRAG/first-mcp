// @ts-check
import { ReflectionKind } from "typedoc";
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

const kindLabels = {
	[ReflectionKind.Class]: "class",
	[ReflectionKind.Interface]: "interface",
	[ReflectionKind.Function]: "function",
	[ReflectionKind.TypeAlias]: "type",
	[ReflectionKind.Variable]: "variable",
	[ReflectionKind.Enum]: "enum",
	[ReflectionKind.Module]: "module",
	[ReflectionKind.Namespace]: "namespace",
};

const layerPatterns = [
	{ pattern: /\/tool\//, label: "Tool" },
	{ pattern: /\/controller\//, label: "Controller" },
	{ pattern: /\/service\//, label: "Service" },
	{ pattern: /\/repository\//, label: "Repository" },
	{ pattern: /\/transport\//, label: "Transport" },
	{ pattern: /\/config\//, label: "Configuration" },
	{ pattern: /\/server\//, label: "Server Factory" },
];

function detectLayer(model) {
	const sources = model?.sources;
	if (!sources?.length) return null;
	const fileName = sources[0].fileName;
	for (const { pattern, label } of layerPatterns) {
		if (pattern.test(fileName)) return label;
	}
	return null;
}

/**
 * Dynamic frontmatter plugin — adds title, type, and layer to each page.
 * Also injects a layer badge into page content for architectural context.
 *
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
	app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
		const model = page.model;
		if (!model) return;

		const kind = kindLabels[model.kind] ?? "unknown";
		const layer = detectLayer(model);

		page.frontmatter = {
			...page.frontmatter,
			title: model.name,
			type: kind,
			...(layer ? { layer } : {}),
		};
	});

	app.renderer.on(MarkdownPageEvent.END, (page) => {
		const layer = detectLayer(page.model);
		if (layer && page.contents) {
			page.contents = page.contents.replace(
				/^(# .+\n)/m,
				`$1\n> **${layer} Layer**\n`,
			);
		}
	});
}
