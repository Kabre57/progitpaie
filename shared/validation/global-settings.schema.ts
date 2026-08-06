import { z } from "zod";

export const GlobalCNPSRatesSchema = z.object({
  cnpsEmployeeRetraite: z.number().min(0).max(100),
  cnpsEmployerRetraite: z.number().min(0).max(100),
  cnpsEmployerAT: z.number().min(0).max(100),
  cnpsEmployerPF: z.number().min(0).max(100),
  cnpsCeilingRetraite: z.number().min(0),
  cnpsCeilingPF_AT: z.number().min(0),
  fdfpTA: z.number().min(0).max(100),
  fdfpFPC: z.number().min(0).max(100),
  itsRate: z.number().min(0).max(100),
  cmuBase: z.number().min(0),
  cmuEmployeeRate: z.number().min(0).max(100),
  cmuEmployerRate: z.number().min(0).max(100),
  transportExemptAmount: z.number().min(0),
  defaultHourlyBase: z.number().min(100).max(300),
});

export const GlobalLeavePolicySchema = z.object({
  annualLeaveDays: z.number().int().min(0).max(365),
  sickLeaveDays: z.number().int().min(0).max(365),
  maternityLeaveDays: z.number().int().min(0).max(365),
  paternityLeaveDays: z.number().int().min(0).max(365),
});

export const GlobalSecurityPolicySchema = z.object({
  jwtExpiresInMinutes: z.number().int().min(15).max(10080), // 15 min → 7 jours
  maxLoginAttempts: z.number().int().min(1).max(20),
  lockoutDurationMinutes: z.number().int().min(1).max(1440),
  requireMFA: z.boolean(),
  minPasswordLength: z.number().int().min(6).max(64),
});

export const UpdateGlobalSettingsSchema = z.object({
  cnpsRates: GlobalCNPSRatesSchema.partial().optional(),
  leavePolicy: GlobalLeavePolicySchema.partial().optional(),
  securityPolicy: GlobalSecurityPolicySchema.partial().optional(),
});

export type UpdateGlobalSettingsInput = z.infer<typeof UpdateGlobalSettingsSchema>;
