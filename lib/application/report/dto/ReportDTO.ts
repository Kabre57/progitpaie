export interface ReportDTO {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentBreakdown: Array<{ name: string; count: number }>;
  contractTypes: {
    CDI: number;
    CDD: number;
    STAGE: number;
    FREELANCE: number;
  };
  lastMonthCosts: {
    totalGrossPayroll: number;
    totalNetPayroll: number;
    totalTaxSocialCost: number;
  };
}
