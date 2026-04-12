/**
 * Service for retrieving a single Coffee by name from the repository.
 *
 * @module
 */
import type { Coffee } from "../../shared/type/coffee.types.js";
import type { CoffeeRepository } from "../../shared/repository/coffee/coffee.repository.js";

/**
 * Service contract for retrieving a single coffee by name.
 *
 * @see {@link GetACoffeeService} for the implementation.
 */
export interface GetACoffeeServiceClass {
	/**
	 * Retrieves a coffee by its exact name.
	 *
	 * @param name - The exact display name of the coffee.
	 * @returns The matching coffee, or `undefined` if not found.
	 */
	execute(name: string): Coffee | undefined;
}

/**
 * Retrieves a single coffee drink from the repository by name.
 *
 * @remarks
 * Delegates to {@link CoffeeRepository.findByName} for the actual lookup.
 *
 * @see {@link GetACoffeeServiceClass} for the interface contract.
 */
export class GetACoffeeService implements GetACoffeeServiceClass {
	/** @param repo - The coffee repository to query. */
	constructor(private readonly repo: CoffeeRepository) { }

	/**
	 * Finds a coffee drink by name.
	 *
	 * @param name - The exact display name to search for.
	 * @returns The matching coffee, or `undefined` if no match exists.
	 */
	execute(name: string): Coffee | undefined {
		return this.repo.findByName(name);
	}
}
