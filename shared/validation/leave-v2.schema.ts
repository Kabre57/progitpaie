import { z } from "zod";

export const applyLeaveSchema = z.object({
  leaveType: z.enum(["annual", "sick", "casual", "unpaid", "maternity", "paternity"]),
  startDate: z.string().min(10, "Date de début requise (YYYY-MM-DD)"),
  endDate: z.string().min(10, "Date de fin requise (YYYY-MM-DD)"),
  reason: z.string().min(3, "Motif obligatoire"),
});

export const leaveDecisionSchema = z.object({
  comment: z.string().optional(),
});

export const listLeavesQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  leaveType: z.string().optional(),
});
