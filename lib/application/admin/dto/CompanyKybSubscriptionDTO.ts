import { VerificationStatus, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export interface CompanyDocumentDTO {
  id: string;
  companyId: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  status: VerificationStatus;
  rejectReason?: string | null;
  uploadedAt: string;
  verifiedAt?: string | null;
  verifiedById?: string | null;
}

export interface VerifyCompanyInput {
  companyId: string;
  status: VerificationStatus;
  notes?: string;
  verifiedById: string;
}

export interface UpdateSubscriptionInput {
  companyId: string;
  plan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiresAt?: string | null;
  monthlyPriceFCFA?: number;
  maxEmployeesAllowed?: number;
}

export interface CompanyKybDetailsDTO {
  companyId: string;
  companyName: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string | null;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string | null;
  monthlyPriceFCFA: number;
  maxEmployeesAllowed: number;
  documents: CompanyDocumentDTO[];
}
