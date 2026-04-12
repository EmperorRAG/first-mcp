/**
 * Service for retrieving all Coffee entities from the repository.
 *
 * @module
 */
import type { Coffee } from "../../shared/type/coffee.types.js";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";

/**
 * Service contract for retrieving all coffee drinks.
 *
 * @see {@link GetCoffeesService} for the implementation.
 */
export interface GetCoffeesServiceClass {
	/**
	 * Retrieves all available coffee drinks.
	 *
	 * @returns An array of all coffees in the catalog.
	 */
	execute(): Coffee[];
}

/**
 * Retrieves all coffee drinks from the repository.
 *
 * @remarks
 * Delegates to {@link CoffeeRepository.findAll} for data access.
 *
 * @see {@link GetCoffeesServiceClass} for the interface contract.
 */
export class GetCoffeesService implements GetCoffeesServiceClass {
	/** @param repo - The coffee repository to query. */
	constructor(private readonly repo: CoffeeRepository) { }

	/**
	 * Returns all coffee drinks from the repository.
	 *
	 * @returns An array of all available coffee drinks.
	 */
	execute(): Coffee[] {
		return this.repo.findAll();
	}
}
