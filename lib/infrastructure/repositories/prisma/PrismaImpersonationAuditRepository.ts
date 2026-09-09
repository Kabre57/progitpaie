import { prisma } from "@/lib/db";
import { ImpersonationAuditPort } from "@/lib/application/admin/ports/ImpersonationAuditPort";

export class PrismaImpersonationAuditRepository implements ImpersonationAuditPort {
  async getCompanyDetails(companyId: string): Promise<{ id: string; name: string } | null> {
    return prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });
  }

  async getUserDetails(userId: string): Promise<{ id: string; name: string; email: string; role: string } | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async logImpersonationStart(superAdminId: string, companyId: string, companyName: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        performedById: superAdminId,
        companyId,
        action: "IMPERSONATION_START",
        targetModel: "Company",
        targetId: companyId,
        newValues: { companyName, mode: "SUPPORT_SESSION" },
      },
    });
  }

  async logImpersonationExit(superAdminId: string, companyId: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        performedById: superAdminId,
        companyId,
        action: "IMPERSONATION_END",
        targetModel: "Company",
        targetId: companyId,
        newValues: { mode: "SUPPORT_SESSION_CLOSED" },
      },
    });
  }
}
