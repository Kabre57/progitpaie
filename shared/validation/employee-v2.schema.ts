import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  role: z.enum(["admin", "manager", "employee", "accountant"]).optional(),
  departmentId: z.string().optional(),
  shiftId: z.string().optional(),
  employeeId: z.string().optional(),
  salary: z.number().min(0).optional(),
  sursalaire: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  housingAllowance: z.number().min(0).optional(),
  partsIGR: z.number().min(1).max(5).optional(),
  cnpsNumber: z.string().optional(),
  idCardNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHECK"]).optional(),
  joiningDate: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const listEmployeesQuerySchema = z.object({
  departmentId: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
});
