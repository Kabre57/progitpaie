import { ImpersonationAuditPort } from "../ports/ImpersonationAuditPort";
import { StartImpersonationInput, ImpersonationSessionDTO } from "../dto/ImpersonationDTO";

export class ImpersonateTenantUseCase {
  constructor(private readonly auditRepo: ImpersonationAuditPort) {}

  async execute(input: StartImpersonationInput): Promise<ImpersonationSessionDTO> {
    const user = await this.auditRepo.getUserDetails(input.superAdminId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Seul un utilisateur avec le rôle super_admin peut initier une session support");
    }

    const company = await this.auditRepo.getCompanyDetails(input.companyId);
    if (!company) {
      throw new Error("Entreprise introuvable");
    }

    await this.auditRepo.logImpersonationStart(input.superAdminId, company.id, company.name);

    return {
      isImpersonating: true,
      superAdminId: user.id,
      superAdminName: user.name,
      superAdminEmail: user.email,
      targetCompanyId: company.id,
      targetCompanyName: company.name,
      startedAt: new Date().toISOString(),
    };
  }
}
