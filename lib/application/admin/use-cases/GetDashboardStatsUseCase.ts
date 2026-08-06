import { prisma } from "@/lib/db";
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

    const earliestYear = months12[0].year;
    const earliestMonth = months12[0].month;

    // ─── Parallel queries ───────────────────────────────────────────────────
    const [
      totalTenants,
      activeTenants,
      totalEmployees,
      activeEmployees,
      yearPayrollAgg,
      currentMonthPayrollAgg,
      currentMonthPayrollCount,
      employeesByCompany,
      payrollsByCompany,
      payrollNetByCompany,
      rawPayrollSeries,
      inactiveTenantList,
      tenantsWithNoPayrollThisMonth,
      recentAuditLogs,
    ] = await Promise.all([
      // 1. Total tenants
      prisma.company.count(),

      // 2. Active tenants
      prisma.company.count({ where: { isActive: true } }),

      // 3. Total employees
      prisma.user.count(),

      // 4. Active employees
      prisma.user.count({ where: { isActive: true } }),

      // 5. Annual payroll sum (all years in rolling window)
      prisma.payroll.aggregate({
        _sum: { netSalary: true },
        where: {
          status: "finalized",
          OR: months12.map((m) => ({ month: m.month, year: m.year })),
        },
      }),

      // 6. Current month payroll sum
      prisma.payroll.aggregate({
        _sum: { netSalary: true },
        where: { month: currentMonth, year: currentYear, status: "finalized" },
      }),

      // 7. Current month payroll count
      prisma.payroll.count({
        where: { month: currentMonth, year: currentYear, status: "finalized" },
      }),

      // 8. Employees per company (for top tenants)
      prisma.user.groupBy({
        by: ["companyId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // 9. Payrolls (finalized) per company
      prisma.payroll.groupBy({
        by: ["companyId"],
        _count: { id: true },
        where: { status: "finalized" },
      }),

      // 10. Net salary sum per company (finalized)
      prisma.payroll.groupBy({
        by: ["companyId"],
        _sum: { netSalary: true },
        where: { status: "finalized" },
      }),

      // 11. Monthly payroll series (rolling 12 months)
      prisma.payroll.groupBy({
        by: ["month", "year"],
        _sum: { netSalary: true },
        _count: { id: true },
        where: {
          status: "finalized",
          OR: months12.map((m) => ({ month: m.month, year: m.year })),
        },
      }),

      // 12. Inactive tenants (for alerts)
      prisma.company.findMany({
        where: { isActive: false },
        select: { id: true, name: true },
        take: 10,
      }),

      // 13. Active tenants with no payroll this month (alert: missing payroll)
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

      // 14. Recent audit logs (last 7 days)
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: "desc" },
        take: 10,
        include: { company: { select: { name: true } } },
      }),
    ]);

    // ─── Compute year-range payroll totals ──────────────────────────────────
    const totalPayrollsCount = await prisma.payroll.count({
      where: {
        status: "finalized",
        OR: months12.map((m) => ({ month: m.month, year: m.year })),
      },
    });

    // ─── Build KPIs ─────────────────────────────────────────────────────────
    const kpis: DashboardKPIs = {
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalEmployees,
      activeEmployees,
      totalPayrollAmount: Number(yearPayrollAgg._sum?.netSalary ?? 0),
      totalPayrollsCount,
      currentMonthPayrollAmount: Number(
        currentMonthPayrollAgg._sum?.netSalary ?? 0
      ),
      currentMonthPayrollsCount: currentMonthPayrollCount,
    };

    // ─── Build monthly series ────────────────────────────────────────────────
    const rawMap = new Map<
      string,
      { netSalarySum: number; payrollCount: number }
    >();
    for (const row of rawPayrollSeries) {
      rawMap.set(`${row.year}-${row.month}`, {
        netSalarySum: Number(row._sum?.netSalary ?? 0),
        payrollCount: row._count?.id ?? 0,
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
        employeeCount: 0, // filled below via global active employees (no per-month breakdown needed)
      };
    });

    // ─── Build top tenants (top 5 by employee count) ─────────────────────────
    const companyIds = employeesByCompany.slice(0, 5).map((r) => r.companyId);
    const companyNames = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(companyNames.map((c) => [c.id, c.name]));

    const payrollCountMap = new Map(
      payrollsByCompany.map((r) => [r.companyId, r._count?.id ?? 0])
    );
    const payrollNetMap = new Map(
      payrollNetByCompany.map((r) => [
        r.companyId,
        Number(r._sum?.netSalary ?? 0),
      ])
    );

    const topTenants: DashboardTopTenant[] = employeesByCompany
      .slice(0, 5)
      .map((r) => ({
        id: r.companyId,
        name: nameMap.get(r.companyId) ?? r.companyId,
        employeeCount: r._count?.id ?? 0,
        payrollCount: payrollCountMap.get(r.companyId) ?? 0,
        totalNetSalary: payrollNetMap.get(r.companyId) ?? 0,
      }));

    // ─── Build alerts ─────────────────────────────────────────────────────────
    const alerts: DashboardAlert[] = [];

    for (const t of inactiveTenantList) {
      alerts.push({
        type: "INACTIVE_TENANT",
        severity: "error",
        message: `Entreprise inactive : ${t.name}`,
        companyId: t.id,
        companyName: t.name,
      });
    }

    for (const t of tenantsWithNoPayrollThisMonth) {
      alerts.push({
        type: "NO_PAYROLL_THIS_MONTH",
        severity: "warning",
        message: `Aucune paie générée ce mois pour : ${t.name}`,
        companyId: t.id,
        companyName: t.name,
      });
    }

    // ─── Build recent activity ────────────────────────────────────────────────
    const recentActivity: DashboardRecentActivity[] = recentAuditLogs.map(
      (log: any) => ({
        action: log.action,
        targetModel: log.targetModel,
        companyName: log.company?.name ?? "—",
        timestamp: log.timestamp.toISOString(),
      })
    );

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
