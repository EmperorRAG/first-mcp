import * as z from "zod/v4";

export const GetACoffeeInputSchema = z.object({ name: z.string() });

export type GetACoffeeInput = z.infer<typeof GetACoffeeInputSchema>;
