import { ImpersonationAuditPort } from "../ports/ImpersonationAuditPort";

export class ExitImpersonationUseCase {
  constructor(private readonly auditRepo: ImpersonationAuditPort) {}

  async execute(superAdminId: string, companyId?: string): Promise<void> {
    if (companyId) {
      await this.auditRepo.logImpersonationExit(superAdminId, companyId);
    }
  }
}
