import {
  AuditLogListFilter,
  AuditLogListResultDTO,
  AuditLogEntryDTO,
  AuditLogFiltersMetaDTO,
} from "../dto/AuditLogDTO";
import { SuperAdminRepository } from "../ports/SuperAdminRepository";
import { PrismaSuperAdminRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminRepository";

export class GetAuditLogsUseCase {
  constructor(private readonly superAdminRepo: SuperAdminRepository = new PrismaSuperAdminRepository()) {}

  public async execute(filter: AuditLogListFilter): Promise<AuditLogListResultDTO> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 50));

    const { logs: records, total } = await this.superAdminRepo.findAuditLogs({
      companyId: filter.companyId,
      action: filter.action,
      targetModel: filter.targetModel,
      performedById: filter.performedById,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
      search: filter.search,
      page,
      limit,
    });

    const logs: AuditLogEntryDTO[] = records.map((r) => ({
      id: r.id,
      action: r.action,
      targetModel: r.targetModel,
      targetId: r.targetId ?? undefined,
      companyId: r.companyId,
      companyName: r.companyName,
      performedById: r.performedById,
      performedByName: r.performedByName,
      performedByEmail: r.performedByEmail,
      ipAddress: r.ipAddress ?? undefined,
      userAgent: r.userAgent ?? undefined,
      oldValues: (r.oldValues as Record<string, unknown> | null) ?? undefined,
      newValues: (r.newValues as Record<string, unknown> | null) ?? undefined,
      timestamp: r.timestamp.toISOString(),
    }));

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getFiltersMeta(): Promise<AuditLogFiltersMetaDTO> {
    return this.superAdminRepo.getAuditLogFiltersMeta();
  }
}
