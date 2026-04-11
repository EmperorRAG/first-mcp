import type { Coffee } from "../../shared/coffee.types.js";
import type { CoffeeRepository } from "../../shared/repository/coffee.repository.js";

export class GetCoffeesService {
	constructor(private readonly repo: CoffeeRepository) { }

	execute(): Coffee[] {
		return this.repo.findAll();
	}
}
