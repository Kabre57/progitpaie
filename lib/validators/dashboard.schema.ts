import { z } from "zod";

export const dashboardFilterSchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).default("month"),
  departmentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
