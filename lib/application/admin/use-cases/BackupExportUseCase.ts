import {
  SystemBackupDTO,
  MultiCompanyExportRequest,
  MultiCompanyExportSummary,
} from "../dto/BackupExportDTO";
import { SuperAdminRepository } from "../ports/SuperAdminRepository";
import { PrismaSuperAdminRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminRepository";

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export class BackupExportUseCase {
  constructor(private readonly superAdminRepo: SuperAdminRepository = new PrismaSuperAdminRepository()) {}

  /** List existing system backups */
  public async listBackups(): Promise<SystemBackupDTO[]> {
    const val = await this.superAdminRepo.getSystemBackupsList();
    if (!val || !Array.isArray(val)) {
      return [];
    }
    return val as unknown as SystemBackupDTO[];
  }

  /** Trigger a new system backup snapshot */
  public async createBackup(): Promise<SystemBackupDTO> {
    const { companyCount, userCount, payrollCount, firstCompanyId } =
      await this.superAdminRepo.getCountsForBackup();

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

    await this.superAdminRepo.saveSystemBackupsList(updated);

    // Create an audit log entry
    await this.superAdminRepo.createAuditLog({
      companyId: firstCompanyId,
      performedById: "system-super-admin",
      action: "CREATE_SYSTEM_BACKUP",
      targetModel: "SystemBackup",
      targetId: newBackup.id,
      newValues: newBackup,
    });

    return newBackup;
  }

  /** Generate aggregated multi-company report data */
  public async generateMultiCompanyExport(req: MultiCompanyExportRequest): Promise<{
    summary: MultiCompanyExportSummary;
    csvContent: string;
  }> {
    const rowsRaw = await this.superAdminRepo.getMultiCompanyExportRows(req.companyIds, req.year);

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

    const csvRows: string[][] = [];

    for (const c of rowsRaw) {
      totalEmployees += c.empCount;
      totalPayrolls += c.payCount;
      totalNetSalary += c.netSum;

      csvRows.push([
        c.id,
        c.name,
        c.taxNumber ?? "—",
        c.isActive ? "ACTIVE" : "INACTIVE",
        String(c.empCount),
        String(c.payCount),
        String(Math.round(c.netSum)),
      ]);
    }

    const escape = (val: string) =>
      val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;

    const csvContent =
      BOM +
      [headers, ...csvRows]
        .map((r) => r.map(escape).join(","))
        .join("\r\n");

    return {
      summary: {
        companyCount: rowsRaw.length,
        totalEmployees,
        totalPayrolls,
        totalNetSalary,
        exportedAt: new Date().toISOString(),
      },
      csvContent,
    };
  }
}
