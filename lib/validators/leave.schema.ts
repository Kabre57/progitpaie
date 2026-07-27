import { z } from "zod";

export const applyLeaveSchema = z.object({
  leaveType: z.enum(["sick", "casual", "annual", "unpaid"], {
    message: "Type de congé invalide",
  }),
  startDate: z.string({ message: "La date de début est requise" }),
  endDate: z.string({ message: "La date de fin est requise" }),
  reason: z
    .string({ message: "Le motif du congé est requis" })
    .min(5, "Le motif doit faire au moins 5 caractères"),
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

export const approveRejectLeaveSchema = z.object({
  adminComment: z.string().optional(),
});

export type ApproveRejectLeaveInput = z.infer<typeof approveRejectLeaveSchema>;
