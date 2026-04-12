// @ts-check

/**
 * Shared remark-stringify settings used by both `.remarkrc.js` and `typedoc.config.js`.
 * Single source of truth for Markdown formatting options.
 *
 * @see https://github.com/syntax-tree/mdast-util-to-markdown#options
 * @type {import('mdast-util-to-markdown').Options}
 */
export const remarkStringifySettings = {
	bullet: "-",
	fence: "`",
	emphasis: "*",
	strong: "*",
	listItemIndent: "one",
	rule: "-",
	incrementListMarker: true,
	resourceLink: true,
	tightDefinitions: true,
};
