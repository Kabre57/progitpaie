import {
  AuditLogListFilterInput,
  AuditLogRecord,
  CompanyDocumentRecord,
  CompanyKybRawData,
  DashboardRawStatsData,
  MultiCompanyExportRawRow,
  SuperAdminRepository,
} from "@/lib/application/admin/ports/SuperAdminRepository";
import { prisma } from "@/lib/db";
import { Prisma, VerificationStatus } from "@prisma/client";

export class PrismaSuperAdminRepository implements SuperAdminRepository {
  public async getDashboardStatsData(
    months12: Array<{ month: number; year: number }>,
    currentMonth: number,
    currentYear: number
  ): Promise<DashboardRawStatsData> {
    const [
      totalTenants,
      activeTenants,
      totalEmployees,
      activeEmployees,
      yearPayrollAgg,
      currentMonthPayrollAgg,
      currentMonthPayrollCount,
      employeesByCompanyRaw,
      payrollsByCompanyRaw,
      payrollNetByCompanyRaw,
      rawPayrollSeries,
      inactiveTenantList,
      tenantsWithNoPayrollThisMonth,
      recentAuditLogsRaw,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.payroll.aggregate({
        _sum: { netSalary: true },
        where: {
          status: "finalized",
          OR: months12.map((m) => ({ month: m.month, year: m.year })),
        },
      }),
      prisma.payroll.aggregate({
        _sum: { netSalary: true },
        where: { month: currentMonth, year: currentYear, status: "finalized" },
      }),
      prisma.payroll.count({
        where: { month: currentMonth, year: currentYear, status: "finalized" },
      }),
      prisma.user.groupBy({
        by: ["companyId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.payroll.groupBy({
        by: ["companyId"],
        _count: { id: true },
        where: { status: "finalized" },
      }),
      prisma.payroll.groupBy({
        by: ["companyId"],
        _sum: { netSalary: true },
        where: { status: "finalized" },
      }),
      prisma.payroll.groupBy({
        by: ["month", "year"],
        _sum: { netSalary: true },
        _count: { id: true },
        where: {
          status: "finalized",
          OR: months12.map((m) => ({ month: m.month, year: m.year })),
        },
      }),
      prisma.company.findMany({
        where: { isActive: false },
        select: { id: true, name: true },
        take: 10,
      }),
      prisma.company.findMany({
        where: {
          isActive: true,
          payrolls: {
            none: { month: currentMonth, year: currentYear },
          },
        },
        select: { id: true, name: true },
        take: 10,
      }),
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: "desc" },
        take: 10,
        include: { company: { select: { name: true } } },
      }),
    ]);

    const totalPayrollsCount = await prisma.payroll.count({
      where: {
        status: "finalized",
        OR: months12.map((m) => ({ month: m.month, year: m.year })),
      },
    });

    const companyIds = employeesByCompanyRaw.slice(0, 5).map((r) => r.companyId);
    const companyNamesList = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const companyNames = new Map(companyNamesList.map((c) => [c.id, c.name]));

    return {
      totalTenants,
      activeTenants,
      totalEmployees,
      activeEmployees,
      annualPayrollSum: Number(yearPayrollAgg._sum?.netSalary ?? 0),
      currentMonthPayrollSum: Number(currentMonthPayrollAgg._sum?.netSalary ?? 0),
      currentMonthPayrollCount,
      totalPayrollsCount,
      employeesByCompany: employeesByCompanyRaw.map((r) => ({ companyId: r.companyId, count: r._count?.id ?? 0 })),
      payrollsByCompany: payrollsByCompanyRaw.map((r) => ({ companyId: r.companyId, count: r._count?.id ?? 0 })),
      payrollNetByCompany: payrollNetByCompanyRaw.map((r) => ({ companyId: r.companyId, totalNet: Number(r._sum?.netSalary ?? 0) })),
      monthlySeries: rawPayrollSeries.map((r) => ({
        month: r.month,
        year: r.year,
        netSalarySum: Number(r._sum?.netSalary ?? 0),
        payrollCount: r._count?.id ?? 0,
      })),
      inactiveTenantList,
      tenantsWithNoPayrollThisMonth,
      recentAuditLogs: recentAuditLogsRaw.map((log) => ({
        action: log.action,
        targetModel: log.targetModel,
        timestamp: log.timestamp,
        companyName: log.company?.name ?? "—",
      })),
      companyNames,
    };
  }

  public async updateCompanySubscription(companyId: string, data: Record<string, unknown>): Promise<void> {
    await prisma.company.update({
      where: { id: companyId },
      data: data as Prisma.CompanyUpdateInput,
    });
  }

  public async createAuditLog(entry: {
    companyId: string;
    performedById: string;
    action: string;
    targetModel: string;
    targetId: string;
    newValues: unknown;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        companyId: entry.companyId,
        performedById: entry.performedById,
        action: entry.action,
        targetModel: entry.targetModel,
        targetId: entry.targetId,
        newValues: entry.newValues as Prisma.InputJsonValue,
      },
    });
  }

  public async getCompanyKybDetails(companyId: string): Promise<CompanyKybRawData | null> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });
    if (!company) return null;

    return {
      id: company.id,
      name: company.name,
      verificationStatus: company.verificationStatus,
      verificationNotes: company.verificationNotes,
      plan: company.plan,
      subscriptionStatus: company.subscriptionStatus,
      subscriptionExpiresAt: company.subscriptionExpiresAt,
      monthlyPriceFCFA: company.monthlyPriceFCFA,
      maxEmployeesAllowed: company.maxEmployeesAllowed,
      documents: company.documents.map((d) => ({
        id: d.id,
        companyId: d.companyId,
        documentType: d.documentType,
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        status: d.status,
        rejectReason: d.rejectReason,
        uploadedAt: d.uploadedAt,
        verifiedAt: d.verifiedAt,
        verifiedById: d.verifiedById,
      })),
    };
  }

  public async addCompanyDocument(input: {
    companyId: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
  }): Promise<CompanyDocumentRecord> {
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
      uploadedAt: doc.uploadedAt,
      verifiedAt: doc.verifiedAt,
      verifiedById: doc.verifiedById,
    };
  }

  public async verifyCompany(
    companyId: string,
    status: VerificationStatus,
    notes: string | null,
    verifiedById: string
  ): Promise<void> {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        verificationStatus: status,
        verificationNotes: notes,
      },
    });

    await prisma.companyDocument.updateMany({
      where: { companyId },
      data: {
        status,
        verifiedAt: new Date(),
        verifiedById,
      },
    });
  }

  public async getGlobalSettingsRows(keys: string[]): Promise<Array<{ key: string; value: unknown; updatedAt: Date }>> {
    const rows = await prisma.settings.findMany({
      where: { key: { in: keys } },
    });
    return rows.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt }));
  }

  public async upsertGlobalSetting(key: string, value: unknown): Promise<void> {
    await prisma.settings.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }

  public async getSystemBackupsList(): Promise<unknown> {
    const row = await prisma.settings.findUnique({
      where: { key: "system_backups_list" },
    });
    return row?.value ?? null;
  }

  public async saveSystemBackupsList(value: unknown): Promise<void> {
    await prisma.settings.upsert({
      where: { key: "system_backups_list" },
      create: { key: "system_backups_list", value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }

  public async getCountsForBackup(): Promise<{ companyCount: number; userCount: number; payrollCount: number; firstCompanyId: string }> {
    const [companyCount, userCount, payrollCount, firstCompany] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.payroll.count(),
      prisma.company.findFirst({ select: { id: true } }),
    ]);
    return {
      companyCount,
      userCount,
      payrollCount,
      firstCompanyId: firstCompany?.id ?? "global",
    };
  }

  public async getMultiCompanyExportRows(companyIds?: string[], year?: number): Promise<MultiCompanyExportRawRow[]> {
    const companyWhere = companyIds && companyIds.length > 0 ? { id: { in: companyIds } } : {};
    const yearWhere = year ? { year } : {};

    const [companies, userGroups, payrollCounts, payrollSums] = await Promise.all([
      prisma.company.findMany({
        where: companyWhere,
        select: { id: true, name: true, taxNumber: true, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.groupBy({
        by: ["companyId"],
        _count: { id: true },
      }),
      prisma.payroll.groupBy({
        by: ["companyId"],
        where: yearWhere,
        _count: { id: true },
      }),
      prisma.payroll.groupBy({
        by: ["companyId"],
        where: { ...yearWhere, status: "finalized" },
        _sum: { netSalary: true },
      }),
    ]);

    const userCountMap = new Map(userGroups.map((g) => [g.companyId, g._count.id]));
    const payrollCountMap = new Map(payrollCounts.map((g) => [g.companyId, g._count.id]));
    const payrollSumMap = new Map(payrollSums.map((g) => [g.companyId, Number(g._sum.netSalary ?? 0)]));

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      taxNumber: c.taxNumber,
      isActive: c.isActive,
      empCount: userCountMap.get(c.id) ?? 0,
      payCount: payrollCountMap.get(c.id) ?? 0,
      netSum: payrollSumMap.get(c.id) ?? 0,
    }));
  }

  public async findAuditLogs(filter: AuditLogListFilterInput): Promise<{ logs: AuditLogRecord[]; total: number }> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filter.companyId) where.companyId = filter.companyId;
    if (filter.action) where.action = { contains: filter.action, mode: "insensitive" };
    if (filter.targetModel) where.targetModel = filter.targetModel;
    if (filter.performedById) where.performedById = filter.performedById;
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

    return {
      total,
      logs: records.map((r) => ({
        id: r.id,
        action: r.action,
        targetModel: r.targetModel,
        targetId: r.targetId,
        companyId: r.companyId,
        companyName: r.company?.name ?? "—",
        performedById: r.performedById,
        performedByName: r.performedBy?.name ?? "—",
        performedByEmail: r.performedBy?.email ?? "—",
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        oldValues: r.oldValues,
        newValues: r.newValues,
        timestamp: r.timestamp,
      })),
    };
  }

  public async getAuditLogFiltersMeta(): Promise<{ actions: string[]; targetModels: string[]; companies: Array<{ id: string; name: string }> }> {
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
      actions: actions.map((r) => r.action),
      targetModels: targetModels.map((r) => r.targetModel),
      companies: companies.map((c) => ({ id: c.id, name: c.name })),
    };
  }
}
