import { z } from "zod";

export const calculateSeveranceSchema = z.object({
  userId: z.string().min(1, "L'employé est requis"),
  contractId: z.string().optional(),
  terminationType: z.enum(["licenciement", "demission", "retraite", "fin_cdd"]),
  exitDate: z.string().min(10, "Date de sortie requise (YYYY-MM-DD)"),
  seniorityYears: z.number().min(0, "L'ancienneté doit être positive"),
  noticeIndemnity: z.number().min(0).optional(),
  severanceIndemnity: z.number().min(0).optional(),
  leaveCompensation: z.number().min(0).optional(),
  gratification13th: z.number().min(0).optional(),
});

export const listSeverancesQuerySchema = z.object({
  userId: z.string().optional(),
  terminationType: z.string().optional(),
});
