/**
 * Represents a coffee drink available in the catalog.
 *
 * @remarks
 * Core domain entity used throughout the coffee domain. Properties describe
 * the drink's identity, sizing, pricing, and caffeine content.
 */
export interface Coffee {
	/** Unique identifier for the coffee drink. */
	id: number;
	/** Display name of the coffee drink (e.g., "Flat White", "Espresso"). */
	name: string;
	/** Cup size (e.g., "Small", "Medium", "Large"). */
	size: string;
	/** Price in dollars. */
	price: number;
	/** Whether the drink is served iced. */
	iced: boolean;
	/** Caffeine content in milligrams. */
	caffeineMg: number;
}
