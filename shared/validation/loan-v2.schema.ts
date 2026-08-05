import { z } from "zod";

export const createLoanSchema = z.object({
  userId: z.string().min(1, "L'employé est requis"),
  type: z.enum(["PRET", "AVANCE"]).optional(),
  amount: z.number().min(1, "Le montant doit être supérieur à zéro"),
  monthlyDeduction: z.number().min(1, "La retenue mensuelle doit être supérieure à zéro"),
  startDate: z.string().min(10, "Date de début requise (YYYY-MM-DD)"),
});

export const listLoansQuerySchema = z.object({
  userId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
});
