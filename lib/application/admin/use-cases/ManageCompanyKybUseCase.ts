import { VerificationStatus } from "@prisma/client";
import {
  CompanyKybDetailsDTO,
  CompanyDocumentDTO,
  VerifyCompanyInput,
} from "../dto/CompanyKybSubscriptionDTO";
import { SuperAdminRepository } from "../ports/SuperAdminRepository";
import { PrismaSuperAdminRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminRepository";

export class ManageCompanyKybUseCase {
  constructor(private readonly superAdminRepo: SuperAdminRepository = new PrismaSuperAdminRepository()) {}

  /** Get company KYB details and all uploaded verification documents */
  public async getKybDetails(companyId: string): Promise<CompanyKybDetailsDTO> {
    const company = await this.superAdminRepo.getCompanyKybDetails(companyId);

    if (!company) {
      throw new Error(`Entreprise non trouvée (${companyId})`);
    }

    const documents: CompanyDocumentDTO[] = company.documents.map((d) => ({
      id: d.id,
      companyId: d.companyId,
      documentType: d.documentType,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      status: d.status,
      rejectReason: d.rejectReason,
      uploadedAt: d.uploadedAt.toISOString(),
      verifiedAt: d.verifiedAt?.toISOString() ?? null,
      verifiedById: d.verifiedById,
    }));

    return {
      companyId: company.id,
      companyName: company.name,
      verificationStatus: company.verificationStatus,
      verificationNotes: company.verificationNotes,
      plan: company.plan,
      subscriptionStatus: company.subscriptionStatus,
      subscriptionExpiresAt: company.subscriptionExpiresAt?.toISOString() ?? null,
      monthlyPriceFCFA: company.monthlyPriceFCFA ?? 0,
      maxEmployeesAllowed: company.maxEmployeesAllowed ?? 0,
      documents,
    };
  }

  /** Upload or record a new verification document for a company */
  public async addDocument(input: {
    companyId: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
  }): Promise<CompanyDocumentDTO> {
    const doc = await this.superAdminRepo.addCompanyDocument(input);

    return {
      id: doc.id,
      companyId: doc.companyId,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      status: doc.status,
      rejectReason: doc.rejectReason,
      uploadedAt: doc.uploadedAt.toISOString(),
      verifiedAt: doc.verifiedAt?.toISOString() ?? null,
      verifiedById: doc.verifiedById,
    };
  }

  /** Update overall KYB verification status for a company */
  public async verifyCompany(input: VerifyCompanyInput): Promise<CompanyKybDetailsDTO> {
    await this.superAdminRepo.verifyCompany(
      input.companyId,
      input.status as VerificationStatus,
      input.notes ?? null,
      input.verifiedById
    );

    // Audit log
    await this.superAdminRepo.createAuditLog({
      companyId: input.companyId,
      performedById: input.verifiedById,
      action: `VERIFY_COMPANY_${input.status}`,
      targetModel: "Company",
      targetId: input.companyId,
      newValues: { status: input.status, notes: input.notes },
    });

    return this.getKybDetails(input.companyId);
  }
}
