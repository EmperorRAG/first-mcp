import type { ToolTextResponse } from "../../../type/tool-response/tool-response.js";
import type { GetCoffeesServiceClass } from "../service/get-coffees.service.js";

/**
 * Controller contract for the get-coffees operation.
 *
 * @see {@link GetCoffeesController} for the implementation.
 */
export interface GetCoffeesControllerClass {
	/**
	 * Handles a get-coffees request.
	 *
	 * @returns A tool response with all coffee data.
	 */
	handle(): ToolTextResponse;
}

/**
 * Handles get-coffees requests by delegating to the service layer.
 *
 * @remarks
 * Queries the service for all coffees and formats the result as a
 * JSON-serialized {@link ToolTextResponse}.
 *
 * @see {@link GetCoffeesControllerClass} for the interface contract.
 * @see GetCoffeesService for the service delegate.
 */
export class GetCoffeesController implements GetCoffeesControllerClass {
	/** @param service - The service used to retrieve all coffees. */
	constructor(private readonly service: GetCoffeesServiceClass) { }

	/**
	 * Retrieves all coffees and returns them as a JSON response.
	 *
	 * @returns A JSON-serialized array of all available coffees.
	 */
	handle(): ToolTextResponse {
		const coffees = this.service.execute();
		return {
			content: [{ type: "text", text: JSON.stringify(coffees) }],
		};
	}
}
