import { z } from "zod";
import { DOCUMENT_TYPES } from "@/shared/types/contracts/document.contract";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(), z.number(), z.boolean(), z.null(),
    z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema),
  ])
);

const optionalText = z.string().trim().max(10_000).optional();

export const documentGenerationSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES),
  userId: z.string().min(1).optional(),
  employeeId: z.string().min(1).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  customName: z.string().trim().max(160).optional(),
  customJobTitle: z.string().trim().max(160).optional(),
  customDepartment: z.string().trim().max(160).optional(),
  customSalary: z.number().finite().nonnegative().optional(),
  customSursalaire: z.number().finite().nonnegative().optional(),
  customBodyText: optionalText,
  startDate: optionalText,
  endDate: optionalText,
  returnDate: optionalText,
  bankName: z.string().trim().max(160).optional(),
  totalAmount: z.number().finite().nonnegative().optional(),
  companyName: z.string().trim().max(200).optional(),
  companyAddress: z.string().trim().max(300).optional(),
  companyRepresentative: z.string().trim().max(200).optional(),
  employeeBirth: z.string().trim().max(200).optional(),
  employeeNationality: z.string().trim().max(100).optional(),
  employeeCni: z.string().trim().max(100).optional(),
  employeeAddress: z.string().trim().max(300).optional(),
  articles: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
  itsData: jsonValueSchema.optional(),
  cnpsData: jsonValueSchema.optional(),
  fdfpData: jsonValueSchema.optional(),
  rnsData: jsonValueSchema.optional(),
}).strict().superRefine((value, context) => {
  const employeeDocuments = ["contract", "attestation", "certificat", "attestation_conge", "stc", "payslip", "bulletin", "rns"];
  if (employeeDocuments.includes(value.docType) && !(value.userId || value.employeeId)) {
    context.addIssue({ code: "custom", path: ["userId"], message: "Un salarié est requis pour ce document" });
  }
  const periodDocuments = ["payslip", "bulletin", "declaration_its", "its", "declaration_cnps", "cnps", "declaration_fdfp", "fdfp", "ordre_virement"];
  if (periodDocuments.includes(value.docType) && (!value.month || !value.year)) {
    context.addIssue({ code: "custom", path: ["month"], message: "La période est requise pour ce document" });
  }
});

export type DocumentGenerationInput = z.infer<typeof documentGenerationSchema>;
