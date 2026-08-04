import type Decimal from "decimal.js";
import type { Money, MoneyInput } from "../money";
import type { ProvisionRuleSet } from "./ProvisionRuleSet";

export const PROVISION_RULE_VERSION = "CI-PROVISIONS-2026.1" as const;

export type ProvisionWarningCode =
  | "NEGATIVE_LEAVE_BALANCE"
  | "NO_EFFECTIVE_SERVICE"
  | "INSUFFICIENT_SENIORITY"
  | "MISSING_SALARY_HISTORY"
  | "INCOMPLETE_SALARY_HISTORY"
  | "ZERO_AVERAGE_SALARY"
  | "NO_FINALIZED_PAYROLL"
  | "MISSING_PAYROLL_PERIOD"
  | "COMPENSATION_BREAKDOWN_INCOMPLETE"
  | "EXPENSE_CLASSIFICATION_UNKNOWN"
  | "CONTRACT_FALLBACK_USED"
  | "MISSING_LEAVE_LEDGER"
  | "LEGACY_LEAVE_BALANCE_USED"
  | "CARRIED_DAYS_VALUED_AT_CURRENT_RATE"
  | "FUTURE_REFERENCE_DATE"
  | "TERMINATION_REASON_UNKNOWN"
  | "TENANT_DATA_MISMATCH";

export interface ProvisionWarning {
  readonly code: ProvisionWarningCode;
  readonly message: string;
  readonly severity: "info" | "warning" | "error";
}

export interface LeaveEntitlementInput {
  readonly userId: string;
  readonly employeeName: string;
  readonly companyId: string;
  readonly referenceDate: Date;
  readonly serviceMonths: Decimal.Value;
  readonly openingBalance?: Decimal.Value;
  readonly consumedDays?: Decimal.Value;
  readonly paidDays?: Decimal.Value;
  readonly carriedDays?: Decimal.Value;
  readonly unjustifiedAbsenceDays?: Decimal.Value;
  readonly probationMonths?: Decimal.Value;
  readonly seniorityMonths?: Decimal.Value;
  readonly ruleSet?: ProvisionRuleSet;
}

export interface TerminationBenefitInput {
  readonly userId: string;
  readonly employeeName: string;
  readonly companyId: string;
  readonly referenceDate: Date;
  readonly seniorityMonths: Decimal.Value;
  readonly lastTwelveMonthlySalaries: readonly MoneyInput[];
  readonly ruleSet?: ProvisionRuleSet;
}

export interface ProvisionCalculationInput {
  readonly leave: LeaveEntitlementInput;
  readonly termination: TerminationBenefitInput;
}

export interface LeaveProvisionDTO {
  readonly userId: string;
  readonly employeeName: string;
  readonly companyId: string;
  readonly referenceDate: string;
  readonly serviceMonths: number;
  readonly openingBalance: number;
  readonly accruedDays: number;
  readonly consumedDays: number;
  readonly paidDays: number;
  readonly closingBalance: number;
  readonly provisionAmount: number;
  readonly provisionMethod: "TENTH" | "SALARY_MAINTENANCE";
  readonly warnings: readonly ProvisionWarning[];
}

export interface TerminationBenefitDTO {
  readonly userId: string;
  readonly employeeName: string;
  readonly companyId: string;
  readonly referenceDate: string;
  readonly seniorityMonths: number;
  readonly averageMonthlySalary: number;
  readonly firstTrancheAmount: number;
  readonly secondTrancheAmount: number;
  readonly thirdTrancheAmount: number;
  readonly theoreticalExposure: number;
  readonly warnings: readonly ProvisionWarning[];
}

export interface ProvisionCalculationResult {
  readonly ruleVersion: typeof PROVISION_RULE_VERSION;
  readonly calculatedAt: string;
  readonly leave: LeaveProvisionDTO;
  readonly termination: TerminationBenefitDTO;
  readonly totalExposure: Money;
  readonly warnings: readonly ProvisionWarning[];
}
