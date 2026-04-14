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

	exclude: [],
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
		"Module", "Interface", "Class", "TypeAlias", "Function", "Method", "Property",
	],
	intentionallyNotDocumented: [
		// ── AppConfig (Effect.Service anonymous return) ──────────────────
		"config/app/app-config.AppConfig.__type.name",
		"config/app/app-config.AppConfig.__type.version",
		"config/app/app-config.AppConfig.__type.port",
		"config/app/app-config.AppConfig.[unifySymbol].__type.effect",
		"config/app/app-config.AppConfig.[unifySymbol].__type.effect.__type.name",
		"config/app/app-config.AppConfig.[unifySymbol].__type.effect.__type.version",
		"config/app/app-config.AppConfig.[unifySymbol].__type.effect.__type.port",
		"config/app/app-config.AppConfig.name",
		"config/app/app-config.AppConfig.version",
		"config/app/app-config.AppConfig.port",

		// ── toStandardSchema (return object literal) ────────────────────
		"server/standard-schema-bridge.toStandardSchema.__type.~standard",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.version",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.vendor",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.validate",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.validate.__type.__type.value",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.validate.__type.__type.issues",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.validate.__type.__type.issues.__type.message",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.validate.__type.__type.issues.__type.path",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.validate.__type.__type.issues.__type.path.__type.key",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.jsonSchema",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.jsonSchema.__type.input",
		"server/standard-schema-bridge.toStandardSchema.__type.~standard.__type.jsonSchema.__type.output",

		// ── CoffeeNotFoundError (Data.TaggedError field) ────────────────
		"service/coffee/errors.CoffeeNotFoundError.__type.coffeeName",
		"service/coffee/errors.CoffeeNotFoundError.coffeeName",

		// ── GetACoffeeInput (Schema.Struct field) ───────────────────────
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInput.__type.name",

		// ── GetACoffeeInputStandard (~standard subtree) ─────────────────
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.version",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.vendor",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate.__type.__type.value",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate.__type.__type.value.__type.name",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate.__type.__type.issues",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate.__type.__type.issues.__type.message",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate.__type.__type.issues.__type.path",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.validate.__type.__type.issues.__type.path.__type.key",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.jsonSchema",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.jsonSchema.__type.input",
		"service/coffee/module/get-a-coffee/get-a-coffee.schema.GetACoffeeInputStandard.__type.~standard.__type.jsonSchema.__type.output",

		// ── GetACoffeeService (Effect.Service anonymous return) ─────────
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.__type.execute",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.__type.executeFormatted",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.__type.executeFormatted.__type.__type.content",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.__type.executeFormatted.__type.__type.content.__type.type",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.__type.executeFormatted.__type.__type.content.__type.text",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.[unifySymbol].__type.effect",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.[unifySymbol].__type.effect.__type.execute",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.[unifySymbol].__type.effect.__type.executeFormatted",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.[unifySymbol].__type.effect.__type.executeFormatted.__type.__type.content",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.execute",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.executeFormatted",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.executeFormatted.__type.__type.content",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.executeFormatted.__type.__type.content.__type.type",
		"service/coffee/module/get-a-coffee/get-a-coffee.service.GetACoffeeService.executeFormatted.__type.__type.content.__type.text",

		// ── GetCoffeesService (Effect.Service anonymous return) ─────────
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.__type.execute",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.__type.executeFormatted",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.__type.executeFormatted.__type.content",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.__type.executeFormatted.__type.content.__type.type",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.__type.executeFormatted.__type.content.__type.text",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.[unifySymbol].__type.effect",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.[unifySymbol].__type.effect.__type.execute",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.[unifySymbol].__type.effect.__type.executeFormatted",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.[unifySymbol].__type.effect.__type.executeFormatted.__type.content",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.[unifySymbol].__type.effect.__type.executeFormatted.__type.content.__type.type",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.[unifySymbol].__type.effect.__type.executeFormatted.__type.content.__type.text",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.execute",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.executeFormatted",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.executeFormatted.__type.content",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.executeFormatted.__type.content.__type.type",
		"service/coffee/module/get-coffees/get-coffees.service.GetCoffeesService.executeFormatted.__type.content.__type.text",
	],

	// External symbol link mappings (Section 2.5 — real documentation URLs)
	externalSymbolLinkMappings: {
		"effect": {
			"*": "https://effect-ts.github.io/effect/",
		},
		"@modelcontextprotocol/server": {
			"*": "https://github.com/modelcontextprotocol/typescript-sdk",
		},
		"@modelcontextprotocol/node": {
			"*": "https://github.com/modelcontextprotocol/typescript-sdk",
		},
		"@types/node": {
			"*": "https://nodejs.org/api/",
		},
		"typescript": {
			"*": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
		},
		"coffee-mate": {
			"*": "#",
		},
	},

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
