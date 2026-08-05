import { z } from "zod";

export const getAccountingQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
});
