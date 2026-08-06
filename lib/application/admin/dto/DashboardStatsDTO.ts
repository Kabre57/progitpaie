export interface DashboardKPIs {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalEmployees: number;
  activeEmployees: number;
  totalPayrollAmount: number;        // FCFA, cumul annuel
  totalPayrollsCount: number;        // bulletins finalisés, cumul annuel
  currentMonthPayrollAmount: number; // FCFA, mois courant
  currentMonthPayrollsCount: number; // bulletins, mois courant
}

export interface DashboardMonthlyPoint {
  month: number;
  year: number;
  label: string;          // "Jan 26", "Fév 26", …
  netSalarySum: number;   // FCFA
  payrollCount: number;
  employeeCount: number;
}

export interface DashboardTopTenant {
  id: string;
  name: string;
  employeeCount: number;
  payrollCount: number;
  totalNetSalary: number; // FCFA
}

export type AlertSeverity = "error" | "warning" | "info";
export type AlertType =
  | "INACTIVE_TENANT"
  | "NO_PAYROLL_THIS_MONTH"
  | "AUDIT_EVENT";

export interface DashboardAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  companyId?: string;
  companyName?: string;
  timestamp?: string;
}

export interface DashboardRecentActivity {
  action: string;
  targetModel: string;
  companyName: string;
  timestamp: string;
}

export interface DashboardStatsDTO {
  kpis: DashboardKPIs;
  monthlySeries: DashboardMonthlyPoint[];
  topTenants: DashboardTopTenant[];
  alerts: DashboardAlert[];
  recentActivity: DashboardRecentActivity[];
  generatedAt: string; // ISO timestamp
}
