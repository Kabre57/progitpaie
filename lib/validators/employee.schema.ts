import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string({ message: "Le nom est requis" }).min(2, "Le nom doit contenir au moins 2 caractères").trim(),
  email: z.string({ message: "L'adresse email est requise" }).email("Format d'email invalide").transform((v) => v.toLowerCase().trim()),
  password: z.string({ message: "Le mot de passe est requis" }).min(6, "Au moins 6 caractères").optional(),
  role: z.enum(["admin", "employee"]).default("employee"),
  employeeId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  shiftId: z.string().nullable().optional(),
  jobTitle: z.string().optional(),
  joiningDate: z.string().or(z.date()).optional(),
  salary: z.number().nonnegative("Le salaire de base doit être positif ou nul").optional(),
  sursalaire: z.number().nonnegative("Le sursalaire doit être positif ou nul").optional(),
  civility: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  childrenCount: z.number().int().nonnegative().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  cnpsNumber: z.string().optional(),
  idCardType: z.string().optional(),
  idCardNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  paymentMethod: z.string().optional(),
  contractType: z.string().optional(),
  cnpsExempt: z.boolean().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
