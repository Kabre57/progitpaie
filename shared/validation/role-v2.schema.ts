import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(2, "Le nom du rôle doit contenir au moins 2 caractères").max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
});

export const createPermissionModuleSchema = z.object({
  name: z.string().min(2, "Le nom du module doit contenir au moins 2 caractères").max(100),
  code: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/, "Le code doit être en minuscules (lettres, chiffres, tirets)"),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export const createPermissionDefinitionSchema = z.object({
  moduleId: z.string().min(1, "L'identifiant du module est requis"),
  name: z.string().min(2, "Le nom de la permission doit contenir au moins 2 caractères").max(100),
  code: z.string().min(2).max(100).regex(/^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/, "Format de code invalide (ex: employees.read)"),
  action: z.enum(["read", "create", "update", "delete", "approve", "export", "custom"]).default("read"),
  description: z.string().max(500).optional(),
});

export const assignRoleSchema = z.object({
  userId: z.string().min(1, "L'identifiant utilisateur est requis"),
  roleId: z.string().nullable(),
});
