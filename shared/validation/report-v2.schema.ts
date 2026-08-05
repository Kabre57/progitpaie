import { z } from "zod";

export const getReportQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
});
