import type { ToolTextResponse } from "../../../common/type/tool-response/tool-response.js";
import type { GetCoffeesService } from "../service/get-coffees.service.js";

export class GetCoffeesController {
	constructor(private readonly service: GetCoffeesService) { }

	handle(): ToolTextResponse {
		const coffees = this.service.execute();
		return {
			content: [{ type: "text", text: JSON.stringify(coffees) }],
		};
	}
}
