import { prisma } from "@/lib/db";
import { VerificationStatus } from "@prisma/client";
import {
  CompanyKybDetailsDTO,
  CompanyDocumentDTO,
  VerifyCompanyInput,
} from "../dto/CompanyKybSubscriptionDTO";

export class ManageCompanyKybUseCase {
  /** Get company KYB details and all uploaded verification documents */
  public async getKybDetails(companyId: string): Promise<CompanyKybDetailsDTO> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!company) {
      throw new Error(`Entreprise non trouvée (${companyId})`);
    }

    const documents: CompanyDocumentDTO[] = company.documents.map((d: any) => ({
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
      monthlyPriceFCFA: company.monthlyPriceFCFA,
      maxEmployeesAllowed: company.maxEmployeesAllowed,
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
    const doc = await prisma.companyDocument.create({
      data: {
        companyId: input.companyId,
        documentType: input.documentType,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        status: VerificationStatus.PENDING,
      },
    });

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
    await prisma.company.update({
      where: { id: input.companyId },
      data: {
        verificationStatus: input.status,
        verificationNotes: input.notes ?? null,
      },
    });

    // Update status of all pending documents to match
    await prisma.companyDocument.updateMany({
      where: { companyId: input.companyId },
      data: {
        status: input.status,
        verifiedAt: new Date(),
        verifiedById: input.verifiedById,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        performedById: input.verifiedById,
        action: `VERIFY_COMPANY_${input.status}`,
        targetModel: "Company",
        targetId: input.companyId,
        newValues: { status: input.status, notes: input.notes } as any,
      },
    });

    return this.getKybDetails(input.companyId);
  }
}
