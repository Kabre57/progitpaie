import { SuperAdminRepository } from "../ports/SuperAdminRepository";
import { PrismaSuperAdminRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminRepository";
import {
  DashboardStatsDTO,
  DashboardKPIs,
  DashboardMonthlyPoint,
  DashboardTopTenant,
  DashboardAlert,
  DashboardRecentActivity,
} from "../dto/DashboardStatsDTO";

const MONTH_LABELS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

export class GetDashboardStatsUseCase {
  constructor(private readonly superAdminRepo: SuperAdminRepository = new PrismaSuperAdminRepository()) {}

  public async execute(): Promise<DashboardStatsDTO> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // ─── Build rolling 12-month window ─────────────────────────────────────
    const months12: Array<{ month: number; year: number; label: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      months12.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `${MONTH_LABELS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      });
    }

    const rawData = await this.superAdminRepo.getDashboardStatsData(months12, currentMonth, currentYear);

    const kpis: DashboardKPIs = {
      totalTenants: rawData.totalTenants,
      activeTenants: rawData.activeTenants,
      inactiveTenants: rawData.totalTenants - rawData.activeTenants,
      totalEmployees: rawData.totalEmployees,
      activeEmployees: rawData.activeEmployees,
      totalPayrollAmount: rawData.annualPayrollSum,
      totalPayrollsCount: rawData.totalPayrollsCount,
      currentMonthPayrollAmount: rawData.currentMonthPayrollSum,
      currentMonthPayrollsCount: rawData.currentMonthPayrollCount,
    };

    const rawMap = new Map<string, { netSalarySum: number; payrollCount: number }>();
    for (const row of rawData.monthlySeries) {
      rawMap.set(`${row.year}-${row.month}`, {
        netSalarySum: row.netSalarySum,
        payrollCount: row.payrollCount,
      });
    }

    const monthlySeries: DashboardMonthlyPoint[] = months12.map((m) => {
      const key = `${m.year}-${m.month}`;
      const row = rawMap.get(key);
      return {
        month: m.month,
        year: m.year,
        label: m.label,
        netSalarySum: row?.netSalarySum ?? 0,
        payrollCount: row?.payrollCount ?? 0,
        employeeCount: 0,
      };
    });

    const payrollCountMap = new Map(rawData.payrollsByCompany.map((r) => [r.companyId, r.count]));
    const payrollNetMap = new Map(rawData.payrollNetByCompany.map((r) => [r.companyId, r.totalNet]));

    const topTenants: DashboardTopTenant[] = rawData.employeesByCompany
      .slice(0, 5)
      .map((r) => ({
        id: r.companyId,
        name: rawData.companyNames.get(r.companyId) ?? r.companyId,
        employeeCount: r.count,
        payrollCount: payrollCountMap.get(r.companyId) ?? 0,
        totalNetSalary: payrollNetMap.get(r.companyId) ?? 0,
      }));

    const alerts: DashboardAlert[] = [];

    for (const t of rawData.inactiveTenantList) {
      alerts.push({
        type: "INACTIVE_TENANT",
        severity: "error",
        message: `Entreprise inactive : ${t.name}`,
        companyId: t.id,
        companyName: t.name,
      });
    }

    for (const t of rawData.tenantsWithNoPayrollThisMonth) {
      alerts.push({
        type: "NO_PAYROLL_THIS_MONTH",
        severity: "warning",
        message: `Aucune paie générée ce mois pour : ${t.name}`,
        companyId: t.id,
        companyName: t.name,
      });
    }

    const recentActivity: DashboardRecentActivity[] = rawData.recentAuditLogs.map((log) => ({
      action: log.action,
      targetModel: log.targetModel,
      companyName: log.companyName,
      timestamp: log.timestamp.toISOString(),
    }));

    return {
      kpis,
      monthlySeries,
      topTenants,
      alerts,
      recentActivity,
      generatedAt: now.toISOString(),
    };
  }
}
