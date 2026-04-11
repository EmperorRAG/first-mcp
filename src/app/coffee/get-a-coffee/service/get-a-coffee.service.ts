import type { Coffee } from "../../shared/type/coffee.types.js";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";

export class GetACoffeeService {
	constructor(private readonly repo: CoffeeRepository) { }

	execute(name: string): Coffee | undefined {
		return this.repo.findByName(name);
	}
}
