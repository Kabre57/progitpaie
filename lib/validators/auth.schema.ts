import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "L'adresse email est requise" })
    .email("Format d'adresse email invalide")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ message: "Le mot de passe est requis" })
    .min(1, "Le mot de passe ne peut pas être vide"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string({ message: "Le nom est requis" })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .trim(),
  email: z
    .string({ message: "L'adresse email est requise" })
    .email("Format d'adresse email invalide")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ message: "Le mot de passe est requis" })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["admin", "employee"]).default("employee"),
  employeeId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ message: "Le mot de passe actuel est requis" }),
  newPassword: z
    .string({ message: "Le nouveau mot de passe est requis" })
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
