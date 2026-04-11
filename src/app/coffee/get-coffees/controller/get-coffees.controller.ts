import type { ToolTextResponse } from "../../../common/type/tool-response/tool-response.js";
import type { GetCoffeesServiceClass } from "../service/get-coffees.service.js";

export interface GetCoffeesControllerClass {
	handle(): ToolTextResponse;
}

export class GetCoffeesController implements GetCoffeesControllerClass {
	constructor(private readonly service: GetCoffeesServiceClass) { }

	handle(): ToolTextResponse {
		const coffees = this.service.execute();
		return {
			content: [{ type: "text", text: JSON.stringify(coffees) }],
		};
	}
}
