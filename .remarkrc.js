import remarkPresetLintConsistent from "remark-preset-lint-consistent";
import remarkPresetLintRecommended from "remark-preset-lint-recommended";
import remarkLintUnorderedListMarkerStyle from "remark-lint-unordered-list-marker-style";

const remarkConfig = {
	settings: {
		bullet: "-",
	},
	plugins: [
		remarkPresetLintConsistent,
		remarkPresetLintRecommended,
		[remarkLintUnorderedListMarkerStyle, "-"],
	],
};

export default remarkConfig;
