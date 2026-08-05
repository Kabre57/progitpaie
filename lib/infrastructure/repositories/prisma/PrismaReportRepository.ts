import { prisma } from "@/lib/db";
import { Money } from "@/lib/domain/payroll/money";
import { ContractDistribution } from "@/lib/domain/report/value-objects/ContractDistribution";
import { PayrollCostsSummary } from "@/lib/domain/report/value-objects/PayrollCostsSummary";
import { HRReportSummary } from "@/lib/domain/report/entities/HRReportSummary";
import { ReportRepository } from "@/lib/application/report/ports/ReportRepository";

export class PrismaReportRepository implements ReportRepository {
  public async getHRReportAnalytics(companyId: string): Promise<HRReportSummary> {
    const [totalEmployees, activeEmployees, departments, contracts, payrolls] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({ where: { isActive: true, companyId } }),
      prisma.department.findMany({
        where: { employees: { some: { companyId } } },
        select: { name: true, _count: { select: { employees: { where: { companyId } } } } },
      }),
      prisma.contract.findMany({ where: { status: "active", user: { companyId } }, select: { type: true } }),
      prisma.payroll.findMany({ where: { user: { companyId } }, orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 }),
    ]);

    const contractTypes = new ContractDistribution(
      contracts.filter((c) => c.type === "CDI").length,
      contracts.filter((c) => c.type === "CDD").length,
      contracts.filter((c) => c.type === "STAGE").length,
      contracts.filter((c) => c.type === "FREELANCE").length
    );

    const lastMonthPayrolls = payrolls.slice(0, activeEmployees || 1);
    const totalGross = lastMonthPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalNet = lastMonthPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalTaxSocial = lastMonthPayrolls.reduce(
      (sum, p) => sum + (p.itsTax || 0) + (p.igrTax || 0) + (p.cnpsEmployer || 0) + (p.fdfpTax || 0),
      0
    );

    const lastMonthCosts = new PayrollCostsSummary(
      Money.of(totalGross),
      Money.of(totalNet),
      Money.of(totalTaxSocial)
    );

    return new HRReportSummary({
      companyId,
      totalEmployees,
      activeEmployees,
      departmentBreakdown: departments.map((d) => ({ name: d.name, count: d._count.employees })),
      contractTypes,
      lastMonthCosts,
    });
  }
}
