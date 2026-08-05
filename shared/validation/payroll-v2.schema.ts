import { z } from "zod";

export const generatePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const updatePayrollBonusesSchema = z.object({
  bonuses: z.number().min(0, "Le montant des primes doit être supérieur ou égal à 0"),
});

export const listPayrollsQuerySchema = z.object({
  month: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  status: z.enum(["draft", "finalized"]).optional(),
});
