import type { Coffee } from "../../shared/coffee.types.js";
import type { CoffeeRepository } from "../../shared/repository/coffee.repository.js";

export class GetACoffeeService {
	constructor(private readonly repo: CoffeeRepository) { }

	execute(name: string): Coffee | undefined {
		return this.repo.findByName(name);
	}
}
