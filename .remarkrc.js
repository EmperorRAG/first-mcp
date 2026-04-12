import remarkPresetLintConsistent from "remark-preset-lint-consistent";
import remarkPresetLintRecommended from "remark-preset-lint-recommended";
import remarkLintUnorderedListMarkerStyle from "remark-lint-unordered-list-marker-style";
import remarkLintTableCellPadding from "remark-lint-table-cell-padding";
import remarkLintHeadingStyle from "remark-lint-heading-style";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { remarkStringifySettings } from "./remark.settings.js";

const remarkConfig = {
	settings: remarkStringifySettings,
	plugins: [
		remarkGfm,
		remarkFrontmatter,
		remarkPresetLintConsistent,
		remarkPresetLintRecommended,
		[remarkLintUnorderedListMarkerStyle, "-"],
		[remarkLintTableCellPadding, false],
		[remarkLintHeadingStyle, "atx"],
	],
};

export default remarkConfig;
