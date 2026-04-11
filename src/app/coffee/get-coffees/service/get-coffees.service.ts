import type { Coffee } from "../../shared/type/coffee.types.js";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";

export class GetCoffeesService {
	constructor(private readonly repo: CoffeeRepository) { }

	execute(): Coffee[] {
		return this.repo.findAll();
	}
}
