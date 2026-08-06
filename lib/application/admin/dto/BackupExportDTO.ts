export interface SystemBackupDTO {
  id: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  companyCount: number;
  recordCount: number;
  createdAt: string;
}

export interface MultiCompanyExportRequest {
  companyIds?: string[]; // Empty or omitted = all companies
  includeEmployees?: boolean;
  includePayrolls?: boolean;
  includeAttendance?: boolean;
  year?: number;
}

export interface MultiCompanyExportSummary {
  companyCount: number;
  totalEmployees: number;
  totalPayrolls: number;
  totalNetSalary: number;
  exportedAt: string;
}
