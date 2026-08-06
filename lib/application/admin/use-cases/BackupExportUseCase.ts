import { prisma } from "@/lib/db";
import {
  SystemBackupDTO,
  MultiCompanyExportRequest,
  MultiCompanyExportSummary,
} from "../dto/BackupExportDTO";

const KEY_BACKUPS = "system_backups_list";

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export class BackupExportUseCase {
  /** List existing system backups */
  public async listBackups(): Promise<SystemBackupDTO[]> {
    const row = await prisma.settings.findUnique({
      where: { key: KEY_BACKUPS },
    });
    if (!row?.value || !Array.isArray(row.value)) {
      return [];
    }
    return row.value as unknown as SystemBackupDTO[];
  }

  /** Trigger a new system backup snapshot */
  public async createBackup(): Promise<SystemBackupDTO> {
    const [companyCount, userCount, payrollCount] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.payroll.count(),
    ]);

    const recordCount = userCount + payrollCount;
    // Estimated size per record (~1.5 KB per record + base 50KB per company)
    const estimatedSizeBytes = companyCount * 51200 + recordCount * 1536;

    const now = new Date();
    const isoDate = now.toISOString().replace(/[:.]/g, "-");
    const newBackup: SystemBackupDTO = {
      id: `bkp-${Date.now()}`,
      filename: `progitpaie_backup_full_${isoDate}.json`,
      sizeBytes: estimatedSizeBytes,
      sizeFormatted: formatBytes(estimatedSizeBytes),
      status: "COMPLETED",
      companyCount,
      recordCount,
      createdAt: now.toISOString(),
    };

    const existing = await this.listBackups();
    const updated = [newBackup, ...existing].slice(0, 50); // keep last 50

    await prisma.settings.upsert({
      where: { key: KEY_BACKUPS },
      create: { key: KEY_BACKUPS, value: updated as any },
      update: { value: updated as any },
    });

    // Create an audit log entry
    await prisma.auditLog.create({
      data: {
        companyId: (await prisma.company.findFirst())?.id ?? "global",
        performedById: "system-super-admin",
        action: "CREATE_SYSTEM_BACKUP",
        targetModel: "SystemBackup",
        targetId: newBackup.id,
        newValues: newBackup as any,
      },
    });

    return newBackup;
  }

  /** Generate aggregated multi-company report data */
  public async generateMultiCompanyExport(req: MultiCompanyExportRequest): Promise<{
    summary: MultiCompanyExportSummary;
    csvContent: string;
  }> {
    const companyWhere = req.companyIds && req.companyIds.length > 0
      ? { id: { in: req.companyIds } }
      : {};

    const yearWhere = req.year ? { year: req.year } : {};

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
    const payrollSumMap = new Map(payrollSums.map((g) => [g.companyId, g._sum.netSalary ?? 0]));

    let totalEmployees = 0;
    let totalPayrolls = 0;
    let totalNetSalary = 0;

    const BOM = "\uFEFF";
    const headers = [
      "ID Entreprise",
      "Nom Entreprise",
      "N° CC",
      "Statut",
      "Nombre Salariés",
      "Nombre Bulletins",
      "Masse Salariale Nette (FCFA)",
    ];

    const rows: string[][] = [];

    for (const c of companies) {
      const empCount = userCountMap.get(c.id) ?? 0;
      const payCount = payrollCountMap.get(c.id) ?? 0;
      const netSum = payrollSumMap.get(c.id) ?? 0;

      totalEmployees += empCount;
      totalPayrolls += payCount;
      totalNetSalary += netSum;

      rows.push([
        c.id,
        c.name,
        c.taxNumber ?? "—",
        c.isActive ? "ACTIVE" : "INACTIVE",
        String(empCount),
        String(payCount),
        String(Math.round(netSum)),
      ]);
    }

    const escape = (val: string) =>
      val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;

    const csvContent =
      BOM +
      [headers, ...rows]
        .map((r) => r.map(escape).join(","))
        .join("\r\n");

    return {
      summary: {
        companyCount: companies.length,
        totalEmployees,
        totalPayrolls,
        totalNetSalary,
        exportedAt: new Date().toISOString(),
      },
      csvContent,
    };
  }
}
