import { z } from "zod";

export const generatePayrollSchema = z.object({
  month: z
    .number({ message: "Le mois est requis" })
    .int()
    .min(1, "Le mois doit être compris entre 1 et 12")
    .max(12, "Le mois doit être compris entre 1 et 12"),
  year: z
    .number({ message: "L'année est requise" })
    .int()
    .min(2020, "Année invalide")
    .max(2100, "Année invalide"),
  userIds: z.array(z.string()).optional(), // Si omis, génère pour tous les employés actifs
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
