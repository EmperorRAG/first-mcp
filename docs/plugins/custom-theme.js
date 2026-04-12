// @ts-check
import { MarkdownTheme, MarkdownThemeContext } from "typedoc-plugin-markdown";

class CoffeeMateThemeContext extends MarkdownThemeContext { }

class CoffeeMateTheme extends MarkdownTheme {
	/** @param {import('typedoc-plugin-markdown').MarkdownPageEvent<import('typedoc').Reflection>} page */
	getRenderContext(page) {
		return new CoffeeMateThemeContext(this, page, this.application.options);
	}
}

/**
 * Custom theme plugin — registers the CoffeeMate theme for future partial/template overrides.
 *
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
	app.renderer.defineTheme("coffeeMate", CoffeeMateTheme);
}
