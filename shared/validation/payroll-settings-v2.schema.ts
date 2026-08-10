import { z } from "zod";

export const payrollGenerationRulesSchema = z.object({
  startDayOfMonth: z.number().int().min(1).max(31).default(25),
  allowEarlyGenerationWithReason: z.boolean().default(true),
  minJustificationLength: z.number().int().min(5).default(10),
});

export type PayrollGenerationRulesDTO = z.infer<typeof payrollGenerationRulesSchema>;

export const generatePayrollWithJustificationSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  justification: z.string().optional(),
});
