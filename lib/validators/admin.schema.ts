import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string({ message: "Le nom du département est requis" }).min(2, "Nom trop court").trim(),
  description: z.string().optional(),
  managerId: z.string().nullable().optional(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

export const shiftSchema = z.object({
  name: z.string({ message: "Le nom de l'horaire est requis" }).min(2).trim(),
  startTime: z.string({ message: "Heure de début requise (ex: 08:00)" }),
  endTime: z.string({ message: "Heure de fin requise (ex: 17:00)" }),
  lateThresholdMinutes: z.number().int().nonnegative().default(15),
});

export type ShiftInput = z.infer<typeof shiftSchema>;
