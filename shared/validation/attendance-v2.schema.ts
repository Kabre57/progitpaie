import { z } from "zod";

export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyMeters: z.number().optional(),
  distanceMeters: z.number().optional(),
  notes: z.string().max(500).optional(),
});

export const overrideAttendanceStatusSchema = z.object({
  status: z.enum(["present", "late", "absent", "half_day", "on_leave", "half-day", "on-leave"]),
  notes: z.string().max(500).optional(),
});

export const listAttendanceQuerySchema = z.object({
  userId: z.string().optional(),
  month: z.string().optional(), // YYYY-MM
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  departmentId: z.string().optional(),
});
