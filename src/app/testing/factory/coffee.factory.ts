import type { Coffee } from "../../coffee/shared/type/coffee.types.js";

export const flatWhiteCoffee: Coffee = {
	id: 1,
	name: "Flat White",
	size: "Medium",
	price: 4.5,
	iced: false,
	caffeineMg: 130,
};

export const espressoCoffee: Coffee = {
	id: 2,
	name: "Espresso",
	size: "Small",
	price: 2.5,
	iced: false,
	caffeineMg: 64,
};

export const defaultCoffeeList: Coffee[] = [flatWhiteCoffee, espressoCoffee];

export function createCoffee(overrides: Partial<Coffee> = {}): Coffee {
	return {
		...flatWhiteCoffee,
		...overrides,
	};
}