import type { ToolTextResponse } from "../../../type/tool-response/tool-response.js";
import type { GetACoffeeServiceClass } from "../service/get-a-coffee.service.js";
import type { GetACoffeeInput } from "../dto/get-a-coffee.dto.js";

/**
 * Controller contract for the get-a-coffee operation.
 *
 * @remarks
 * Defines the protocol-agnostic interface for handling coffee lookup requests.
 *
 * @see {@link GetACoffeeController} for the implementation.
 */
export interface GetACoffeeControllerClass {
	/**
	 * Handles a get-a-coffee request.
	 *
	 * @param input - Validated input containing the coffee name.
	 * @returns A tool response with the coffee data or a "not found" message.
	 */
	handle(input: GetACoffeeInput): ToolTextResponse;
}

/**
 * Handles get-a-coffee requests by delegating to the service layer.
 *
 * @remarks
 * Receives validated input, queries the service for the coffee, and formats
 * the result as a {@link ToolTextResponse}. Returns a "Coffee not found"
 * message when no match exists.
 *
 * @see {@link GetACoffeeControllerClass} for the interface contract.
 * @see GetACoffeeService for the service delegate.
 */
export class GetACoffeeController implements GetACoffeeControllerClass {
	/** @param service - The service used to look up coffees by name. */
	constructor(private readonly service: GetACoffeeServiceClass) { }

	/**
	 * Looks up a coffee by name and returns the result.
	 *
	 * @param input - Validated input containing the coffee name.
	 * @returns A JSON-serialized coffee or a "not found" message.
	 */
	handle(input: GetACoffeeInput): ToolTextResponse {
		const coffee = this.service.execute(input.name);
		if (!coffee) {
			return {
				content: [{ type: "text", text: "Coffee not found" }],
			};
		}
		return {
			content: [{ type: "text", text: JSON.stringify(coffee) }],
		};
	}
}
