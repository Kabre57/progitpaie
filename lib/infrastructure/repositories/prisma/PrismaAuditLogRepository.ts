import type { AuditLogEntryInput, AuditLogRepository } from "@/lib/application/audit/ports/AuditLogRepository";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export class PrismaAuditLogRepository implements AuditLogRepository {
  public async create(entry: AuditLogEntryInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        companyId: entry.companyId,
        performedById: entry.performedById,
        action: entry.action,
        targetModel: entry.targetModel,
        targetId: entry.targetId,
        oldValues: entry.oldValues as Prisma.InputJsonValue,
        newValues: entry.newValues as Prisma.InputJsonValue,
        timestamp: entry.timestamp,
      },
    });
  }
}
