import { prisma } from "@/lib/db";
import {
  AuditLogListFilter,
  AuditLogListResultDTO,
  AuditLogEntryDTO,
  AuditLogFiltersMetaDTO,
} from "../dto/AuditLogDTO";

export class GetAuditLogsUseCase {
  public async execute(filter: AuditLogListFilter): Promise<AuditLogListResultDTO> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 50));
    const skip = (page - 1) * limit;

    // ─── Build WHERE clause ────────────────────────────────────────────────
    const where: any = {};

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }
    if (filter.action) {
      where.action = { contains: filter.action, mode: "insensitive" };
    }
    if (filter.targetModel) {
      where.targetModel = filter.targetModel;
    }
    if (filter.performedById) {
      where.performedById = filter.performedById;
    }
    if (filter.fromDate || filter.toDate) {
      where.timestamp = {};
      if (filter.fromDate) where.timestamp.gte = new Date(filter.fromDate);
      if (filter.toDate) {
        const end = new Date(filter.toDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }
    if (filter.search) {
      where.OR = [
        { action: { contains: filter.search, mode: "insensitive" } },
        { performedBy: { name: { contains: filter.search, mode: "insensitive" } } },
        { performedBy: { email: { contains: filter.search, mode: "insensitive" } } },
        { company: { name: { contains: filter.search, mode: "insensitive" } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: "desc" },
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const logs: AuditLogEntryDTO[] = records.map((r: any) => ({
      id: r.id,
      action: r.action,
      targetModel: r.targetModel,
      targetId: r.targetId ?? undefined,
      companyId: r.companyId,
      companyName: r.company?.name ?? "—",
      performedById: r.performedById,
      performedByName: r.performedBy?.name ?? "—",
      performedByEmail: r.performedBy?.email ?? "—",
      ipAddress: r.ipAddress ?? undefined,
      userAgent: r.userAgent ?? undefined,
      oldValues: r.oldValues as Record<string, unknown> | undefined,
      newValues: r.newValues as Record<string, unknown> | undefined,
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
    const [actions, targetModels, companies] = await Promise.all([
      prisma.auditLog.findMany({
        distinct: ["action"],
        select: { action: true },
        orderBy: { action: "asc" },
        take: 100,
      }),
      prisma.auditLog.findMany({
        distinct: ["targetModel"],
        select: { targetModel: true },
        orderBy: { targetModel: "asc" },
        take: 50,
      }),
      prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      actions: actions.map((r: any) => r.action),
      targetModels: targetModels.map((r: any) => r.targetModel),
      companies: companies.map((c: any) => ({ id: c.id, name: c.name })),
    };
  }
}
