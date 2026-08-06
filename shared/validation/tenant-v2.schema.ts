import { z } from "zod";

export const CreateTenantSchema = z.object({
  name: z.string().min(2, "La raison sociale doit contenir au moins 2 caractères"),
  taxNumber: z.string().optional(),
  cnpsNumber: z.string().optional(),
  rccm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional().default("Abidjan"),
  country: z.string().optional().default("Côte d'Ivoire"),
  phone: z.string().optional(),
  email: z.string().email("Format d'email invalide").optional().or(z.literal("")),
  adminName: z.string().min(2, "Le nom de l'administrateur est obligatoire"),
  adminEmail: z.string().email("Format d'email d'administrateur invalide"),
  adminPassword: z.string().min(8, "Le mot de passe administrateur doit contenir au moins 8 caractères"),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(2, "La raison sociale doit contenir au moins 2 caractères").optional(),
  taxNumber: z.string().optional(),
  cnpsNumber: z.string().optional(),
  rccm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Format d'email invalide").optional().or(z.literal("")),
});

export const ToggleTenantStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const DeleteTenantSchema = z.object({
  confirmationName: z.string().min(1, "Le nom de confirmation est obligatoire"),
});
