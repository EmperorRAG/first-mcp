// @ts-check
import { remarkStringifySettings } from "./remark.settings.js";

/** @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').PluginOptions & import('typedoc-plugin-remark').PluginOptions & import('typedoc-plugin-frontmatter').PluginOptions} */
export default {
	entryPoints: ["./src"],
	entryPointStrategy: "expand",
	tsconfig: "tsconfig.json",

	plugin: [
		"typedoc-plugin-markdown",
		"typedoc-plugin-frontmatter",
		"typedoc-plugin-remark",
		"./docs/plugins/content-hooks.js",
		"./docs/plugins/dynamic-frontmatter.js",
		"./docs/plugins/custom-theme.js",
	],

	// Theme (Section 4.2) — set per-output below

	exclude: ["src/**/*.spec.ts", "src/**/*.steps.ts", "src/app/testing/**"],
	excludePrivate: true,
	excludeInternal: true,

	readme: "none",
	entryFileName: "index",

	// Sorting (Section 2.2)
	sort: ["source-order"],
	groupOrder: ["Interfaces", "Classes", "Functions", "Variables", "*"],

	// Display formats (Section 2.3)
	interfacePropertiesFormat: "table",
	classPropertiesFormat: "table",
	parametersFormat: "table",
	enumMembersFormat: "table",
	typeDeclarationFormat: "table",
	propertyMembersFormat: "table",
	typeAliasPropertiesFormat: "table",
	useCodeBlocks: true,
	expandObjects: true,
	expandParameters: true,
	indexFormat: "table",

	// Validation (Section 2.4 — Phase 3, strict)
	validation: {
		notExported: true,
		invalidLink: true,
		rewrittenLink: true,
		notDocumented: true,
		unusedMergeModuleWith: true,
	},
	requiredToBeDocumented: [
		"Interface", "Class", "TypeAlias", "Function", "Method", "Property",
	],
	intentionallyNotDocumented: [
		"coffee/get-a-coffee/dto/get-a-coffee.dto.GetACoffeeInputSchema.__type.name",
		"type/tool-response/tool-response.ToolTextResponse.content.__type.type",
		"type/tool-response/tool-response.ToolTextResponse.content.__type.text",
	],
	treatValidationWarningsAsErrors: true,

	// JSDoc compatibility (Section 2.1)
	commentStyle: "jsdoc",
	jsDocCompatibility: {
		exampleTag: true,
		defaultTag: true,
		inheritDocTag: true,
		ignoreUnescapedBraces: true,
	},

	// Page structure (Section 3.1)
	hidePageHeader: true,
	hidePageTitle: false,
	hideBreadcrumbs: false,
	pageTitleTemplates: {
		index: (args) => `${args.projectName} API`,
		member: (args) => args.name,
		module: (args) => args.name,
	},

	// Metadata (Section 3.4)
	name: "Coffee Mate MCP Server",
	includeVersion: true,

	// Source links (Section 3.3)
	disableSources: false,
	sourceLinkTemplate:
		"https://github.com/EmperorRAG/first-mcp/blob/{gitRevision}/{path}#L{line}",

	// Remark (Section 3.5)
	remarkStringifyOptions: remarkStringifySettings,
	// Frontmatter (Section 4.3)
	frontmatterGlobals: {
		layout: "api-doc",
		generated: true,
	},

	remarkPlugins: /** @type {any} */ (["remark-gfm", ["remark-frontmatter", "yaml"]]),

	// Summary
	useFirstParagraphOfCommentAsSummary: true,

	// Outputs (Section 3.6)
	outputs: [
		{
			name: "markdown",
			path: "./docs/api",
			options: {
				router: "member",
				theme: "coffeeMate",
			},
		},
		{ name: "json", path: "./docs/api.json" },
		{ name: "html", path: "./docs/api-html" },
	],
};
