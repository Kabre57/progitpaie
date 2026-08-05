import { z } from "zod";

export const getDeclarationQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
});
