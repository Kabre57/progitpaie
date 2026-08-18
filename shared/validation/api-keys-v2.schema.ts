import { z } from "zod";

export const ALLOWED_API_SCOPES = [
  "read:employees",
  "read:payroll",
  "read:attendance",
  "write:employees",
  "write:payroll",
  "read:all",
] as const;

export type ApiScope = typeof ALLOWED_API_SCOPES[number];

export const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "L'intitulé doit comporter au moins 2 caractères")
    .max(100, "L'intitulé ne peut pas dépasser 100 caractères"),
  permissions: z
    .array(z.enum(ALLOWED_API_SCOPES))
    .min(1, "Au moins une permission (scope) doit être sélectionnée"),
  expiresInDays: z.number().int().positive().optional().nullable(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
