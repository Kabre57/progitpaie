import { HRReportSummary } from "@/lib/domain/report/entities/HRReportSummary";

export interface ReportRepository {
  getHRReportAnalytics(companyId: string): Promise<HRReportSummary>;
}
