import { z } from "zod";

export const exportQuerySchema = z.object({
  format: z.enum(["excel", "csv", "pdf"]).default("excel"),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  departmentId: z.string().optional(),
});

export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
