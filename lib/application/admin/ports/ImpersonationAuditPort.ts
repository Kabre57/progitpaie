export interface ImpersonationAuditPort {
  logImpersonationStart(superAdminId: string, companyId: string, companyName: string): Promise<void>;
  logImpersonationExit(superAdminId: string, companyId: string): Promise<void>;
  getCompanyDetails(companyId: string): Promise<{ id: string; name: string } | null>;
  getUserDetails(userId: string): Promise<{ id: string; name: string; email: string; role: string } | null>;
}
