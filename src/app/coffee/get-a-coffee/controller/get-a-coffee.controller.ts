import type { ToolTextResponse } from "../../../common/type/tool-response/tool-response.js";
import type { GetACoffeeServiceClass } from "../service/get-a-coffee.service.js";
import type { GetACoffeeInput } from "../dto/get-a-coffee.dto.js";

export interface GetACoffeeControllerClass {
	handle(input: GetACoffeeInput): ToolTextResponse;
}

export class GetACoffeeController implements GetACoffeeControllerClass {
	constructor(private readonly service: GetACoffeeServiceClass) { }

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
