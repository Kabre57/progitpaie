import { z } from "zod";

export const createOvertimeSchema = z.object({
  userId: z.string().min(1, "L'employé est requis"),
  attendanceId: z.string().optional(),
  date: z.string().min(10, "Date requise (YYYY-MM-DD)"),
  minutes: z.number().min(1, "Les minutes doivent être supérieures à zéro"),
  rate: z.number().optional(),
  reason: z.string().min(3, "Le motif est requis"),
});

export const listOvertimeQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
