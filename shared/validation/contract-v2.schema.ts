import { z } from "zod";

export const createContractSchema = z.object({
  userId: z.string().min(1, "L'employé est requis"),
  type: z.enum(["CDI", "CDD", "STAGE", "FREELANCE"]),
  category: z.enum(["cadre", "maitrise", "employe"]).optional(),
  jobTitle: z.string().min(2, "L'intitulé du poste est requis"),
  startDate: z.string().min(10, "Date de début requise (YYYY-MM-DD)"),
  endDate: z.string().optional(),
  probationPeriodMonths: z.number().min(0).optional(),
  baseSalary: z.number().min(0, "Le salaire de base doit être supérieur ou égal à zéro"),
  sursalaire: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  housingAllowance: z.number().min(0).optional(),
  documentUrl: z.string().optional(),
});

export const listContractsQuerySchema = z.object({
  userId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
});
