import type { Coffee } from "../coffee.types.js";

export interface CoffeeRepository {
	findAll(): Coffee[];
	findByName(name: string): Coffee | undefined;
}

const coffeeDrinks: Coffee[] = [
	{
		id: 1,
		name: "Flat White",
		size: "Medium",
		price: 4.5,
		iced: false,
		caffeineMg: 130,
	},
	{
		id: 2,
		name: "Cappuccino",
		size: "Small",
		price: 3.75,
		iced: false,
		caffeineMg: 80,
	},
	{
		id: 3,
		name: "Latte",
		size: "Large",
		price: 5.25,
		iced: true,
		caffeineMg: 150,
	},
	{
		id: 4,
		name: "Espresso",
		size: "Small",
		price: 2.5,
		iced: false,
		caffeineMg: 64,
	},
];

export class InMemoryCoffeeRepository implements CoffeeRepository {
	findAll(): Coffee[] {
		return coffeeDrinks;
	}

	findByName(name: string): Coffee | undefined {
		return coffeeDrinks.find((c) => c.name === name);
	}
}
