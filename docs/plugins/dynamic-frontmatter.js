// @ts-check
import { ReflectionKind } from "typedoc";
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/** @type {Partial<Record<import('typedoc').ReflectionKind, string>>} */
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

/** @param {import('typedoc').DeclarationReflection | null | undefined} model */
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
		if (!page.isReflectionEvent()) return;
		const model = page.model;

		const kind = kindLabels[model.kind] ?? "unknown";
		const layer = detectLayer(/** @type {import('typedoc').DeclarationReflection} */(model));

		page.frontmatter = {
			...page.frontmatter,
			title: model.name,
			type: kind,
			...(layer ? { layer } : {}),
		};
	});

	app.renderer.on(MarkdownPageEvent.END, (page) => {
		if (!page.isReflectionEvent()) return;
		const layer = detectLayer(/** @type {import('typedoc').DeclarationReflection} */(page.model));
		if (layer && page.contents) {
			page.contents = page.contents.replace(
				/^(# .+\n)/m,
				`$1\n> **${layer} Layer**\n`,
			);
		}
	});
}
