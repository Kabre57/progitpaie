import type { SubscriptionPlan, SubscriptionStatus, VerificationStatus } from "@prisma/client";

export interface DashboardRawStatsData {
  totalTenants: number;
  activeTenants: number;
  totalEmployees: number;
  activeEmployees: number;
  annualPayrollSum: number;
  currentMonthPayrollSum: number;
  currentMonthPayrollCount: number;
  totalPayrollsCount: number;
  employeesByCompany: Array<{ companyId: string; count: number }>;
  payrollsByCompany: Array<{ companyId: string; count: number }>;
  payrollNetByCompany: Array<{ companyId: string; totalNet: number }>;
  monthlySeries: Array<{ month: number; year: number; netSalarySum: number; payrollCount: number }>;
  inactiveTenantList: Array<{ id: string; name: string }>;
  tenantsWithNoPayrollThisMonth: Array<{ id: string; name: string }>;
  recentAuditLogs: Array<{ action: string; targetModel: string; timestamp: Date; companyName: string }>;
  companyNames: Map<string, string>;
}

export interface CompanyDocumentRecord {
  id: string;
  companyId: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  status: VerificationStatus;
  rejectReason: string | null;
  uploadedAt: Date;
  verifiedAt: Date | null;
  verifiedById: string | null;
}

export interface CompanyKybRawData {
  id: string;
  name: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string | null;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: Date | null;
  monthlyPriceFCFA: number | null;
  maxEmployeesAllowed: number | null;
  documents: CompanyDocumentRecord[];
}

export interface MultiCompanyExportRawRow {
  id: string;
  name: string;
  taxNumber: string | null;
  isActive: boolean;
  empCount: number;
  payCount: number;
  netSum: number;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  targetModel: string;
  targetId: string | null;
  companyId: string;
  companyName: string;
  performedById: string;
  performedByName: string;
  performedByEmail: string;
  ipAddress: string | null;
  userAgent: string | null;
  oldValues: unknown;
  newValues: unknown;
  timestamp: Date;
}

export interface AuditLogListFilterInput {
  companyId?: string;
  action?: string;
  targetModel?: string;
  performedById?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SuperAdminRepository {
  // Dashboard
  getDashboardStatsData(months12: Array<{ month: number; year: number }>, currentMonth: number, currentYear: number): Promise<DashboardRawStatsData>;

  // Subscription & KYB
  updateCompanySubscription(companyId: string, data: Record<string, unknown>): Promise<void>;
  createAuditLog(entry: { companyId: string; performedById: string; action: string; targetModel: string; targetId: string; newValues: unknown }): Promise<void>;
  getCompanyKybDetails(companyId: string): Promise<CompanyKybRawData | null>;
  addCompanyDocument(input: { companyId: string; documentType: string; fileUrl: string; fileName: string }): Promise<CompanyDocumentRecord>;
  verifyCompany(companyId: string, status: VerificationStatus, notes: string | null, verifiedById: string): Promise<void>;

  // Global Settings
  getGlobalSettingsRows(keys: string[]): Promise<Array<{ key: string; value: unknown; updatedAt: Date }>>;
  upsertGlobalSetting(key: string, value: unknown): Promise<void>;

  // Backups & Multi-Company Export
  getSystemBackupsList(): Promise<unknown>;
  saveSystemBackupsList(value: unknown): Promise<void>;
  getCountsForBackup(): Promise<{ companyCount: number; userCount: number; payrollCount: number; firstCompanyId: string }>;
  getMultiCompanyExportRows(companyIds?: string[], year?: number): Promise<MultiCompanyExportRawRow[]>;

  // Audit Logs
  findAuditLogs(filter: AuditLogListFilterInput): Promise<{ logs: AuditLogRecord[]; total: number }>;
  getAuditLogFiltersMeta(): Promise<{ actions: string[]; targetModels: string[]; companies: Array<{ id: string; name: string }> }>;
}
