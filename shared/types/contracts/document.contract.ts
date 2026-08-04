import type { Prisma } from "@prisma/client";

export const DOCUMENT_TYPES = [
  "contract", "attestation", "certificat", "attestation_conge", "stc",
  "payslip", "bulletin", "declaration_its", "its", "declaration_cnps",
  "cnps", "declaration_fdfp", "fdfp", "rns", "ordre_virement",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentCustomFields {
  name?: string;
  jobTitle?: string;
  department?: string;
  salary?: number;
  sursalaire?: number;
  bodyText?: string;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
}

export interface DocumentGenerationCommand {
  docType: DocumentType;
  userId?: string;
  month?: number;
  year?: number;
  customFields: DocumentCustomFields;
  itsData?: Prisma.InputJsonValue;
  cnpsData?: Prisma.InputJsonValue;
  fdfpData?: Prisma.InputJsonValue;
  rnsData?: Prisma.InputJsonValue;
  bankName?: string;
  totalAmount?: number;
}
