export interface LeaveProvisionDTO {
  userId: string;
  name: string;
  employeeId: string | null;
  joiningDate: string;
  grossMonthly: number;
  leaveDaysAccrued: number;
  provisionAmount: number;
}

export interface TerminationBenefitDTO {
  userId: string;
  name: string;
  employeeId: string | null;
  joiningDate: string;
  seniorityYears: number;
  grossMonthly: number;
  provisionAmount: number;
}

export interface ProvisionResponse {
  companyId: string;
  year: number;
  leaveProvisions: LeaveProvisionDTO[];
  totalLeaveProvision: number;
  retirementProvisions: TerminationBenefitDTO[];
  totalRetirementProvision: number;
  total: number;
}

export type ProvisionWarningSeverity = "info" | "warning" | "error";

export interface ProvisionWarningDTO {
  code: string;
  message: string;
  severity: ProvisionWarningSeverity;
}

export interface PayrollPeriodUsedDTO {
  year: number;
  month: number;
  eligibleGross: number;
}

export interface LeaveProvisionV2DTO {
  companyId: string;
  userId: string;
  employeeName: string;
  employeeId: string | null;
  referenceDate: string;
  joiningDate: string;
  seniorityMonths: number;
  effectiveServiceMonths: number;
  baseAccruedDays: number;
  seniorityBonusDays: number;
  openingBalanceDays: number;
  carriedForwardDays: number;
  consumedDays: number;
  compensatedDays: number;
  closingBalanceDays: number;
  averageMonthlySalary: number;
  dailyDivisorUsed: 26 | 30;
  salaryMaintenanceDailyRate: number;
  salaryMaintenanceAmount: number;
  tenthRulePeriodSalary: number;
  tenthRuleAmount: number;
  selectedMethod: "TENTH" | "SALARY_MAINTENANCE";
  provisionAmount: number;
  salaryMonthsUsed: number;
  payrollPeriodsUsed: PayrollPeriodUsedDTO[];
  ruleVersion: string;
  warnings: ProvisionWarningDTO[];
}

export interface TerminationBenefitV2DTO {
  companyId: string;
  userId: string;
  employeeName: string;
  employeeId: string | null;
  referenceDate: string;
  seniorityMonths: number;
  seniorityYears: string;
  averageMonthlySalary: number;
  salaryMonthsUsed: number;
  firstTrancheMonths: number;
  firstTrancheAmount: number;
  secondTrancheMonths: number;
  secondTrancheAmount: number;
  thirdTrancheMonths: number;
  thirdTrancheAmount: number;
  theoreticalExposure: number;
  eligible: boolean;
  calculationBasis: "ACTUAL_PAYROLL" | "CONTRACT_FALLBACK";
  payrollPeriodsUsed: PayrollPeriodUsedDTO[];
  ruleVersion: string;
  warnings: ProvisionWarningDTO[];
}

export interface ProvisionDataQualityDTO {
  completeSalaryHistories: number;
  incompleteSalaryHistories: number;
  contractFallbacks: number;
  legacyLeaveBalances: number;
}

export interface ProvisionResponseV2 {
  companyId: string;
  referenceDate: string;
  ruleVersion: string;
  calculatedAt: string;
  leaveProvisions: LeaveProvisionV2DTO[];
  terminationBenefits: TerminationBenefitV2DTO[];
  totalLeaveProvision: number;
  totalTerminationExposure: number;
  totalExposure: number;
  employeesProcessed: number;
  employeesWithWarnings: number;
  warnings: ProvisionWarningDTO[];
  dataQuality: ProvisionDataQualityDTO;
}
