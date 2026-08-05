import { ReportRepository } from "../ports/ReportRepository";
import { ReportDTO } from "../dto/ReportDTO";

export class GetHRReportAnalyticsUseCase {
  constructor(private readonly repository: ReportRepository) {}

  public async execute(companyId: string): Promise<ReportDTO> {
    const report = await this.repository.getHRReportAnalytics(companyId);

    return {
      totalEmployees: report.totalEmployees,
      activeEmployees: report.activeEmployees,
      inactiveEmployees: report.inactiveEmployees,
      departmentBreakdown: [...report.departmentBreakdown],
      contractTypes: {
        CDI: report.contractTypes.cdi,
        CDD: report.contractTypes.cdd,
        STAGE: report.contractTypes.stage,
        FREELANCE: report.contractTypes.freelance,
      },
      lastMonthCosts: {
        totalGrossPayroll: Math.round(report.lastMonthCosts.totalGrossPayroll.toNumber()),
        totalNetPayroll: Math.round(report.lastMonthCosts.totalNetPayroll.toNumber()),
        totalTaxSocialCost: Math.round(report.lastMonthCosts.totalTaxSocialCost.toNumber()),
      },
    };
  }
}
