import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "Le destinataire est requis"),
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(2_000),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  link: z.string().trim().max(500).regex(/^\/(?!\/)/, "Le lien doit être interne").optional(),
}).strict();

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
