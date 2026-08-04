import type { Money } from "../money";
import type { ProvisionWarning } from "./types";

export type LeaveLedgerMovementType =
  | "OPENING_BALANCE"
  | "ACCRUAL"
  | "SENIORITY_BONUS"
  | "LEAVE_CONSUMED"
  | "LEAVE_COMPENSATED"
  | "CARRY_FORWARD"
  | "EXPIRATION"
  | "MANUAL_ADJUSTMENT";

export interface ProvisionEmployeeProfile {
  readonly id: string;
  readonly companyId: string;
  readonly name: string;
  readonly employeeId: string | null;
  readonly joiningDate: Date;
  readonly exitDate: Date | null;
  readonly currentBaseSalary: Money;
  readonly currentSursalaire: Money;
  readonly probationMonths: number;
}

export interface CompensationLineSnapshot {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly category: string;
  readonly amount: Money;
  readonly includedInLeaveBase: boolean;
  readonly includedInTerminationBase: boolean;
  readonly isExpenseReimbursement: boolean;
  readonly classificationSource: string;
  readonly isEstimated: boolean;
}

export interface MonthlyCompensationSnapshot {
  readonly payrollId: string;
  readonly companyId: string;
  readonly userId: string;
  readonly year: number;
  readonly month: number;
  readonly finalizedAt: Date;
  readonly lines: readonly CompensationLineSnapshot[];
  readonly leaveEligibleGross: Money;
  readonly terminationEligibleGross: Money;
  readonly isEstimated: boolean;
  readonly warnings: readonly ProvisionWarning[];
}

export interface LeaveLedgerMovement {
  readonly id: string;
  readonly companyId: string;
  readonly userId: string;
  readonly effectiveDate: Date;
  readonly referencePeriod: string;
  readonly entryType: LeaveLedgerMovementType;
  readonly days: string;
  readonly sourceType: string;
  readonly sourceId: string | null;
  readonly ruleVersion: string;
  readonly isEstimated: boolean;
}

export interface ProvisionEmployeeAggregate {
  readonly employee: ProvisionEmployeeProfile;
  readonly payrolls: readonly MonthlyCompensationSnapshot[];
  readonly leaveLedger: readonly LeaveLedgerMovement[];
}
