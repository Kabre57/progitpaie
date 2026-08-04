import { Money } from "@/lib/domain/payroll/money";
import type {
  CompensationLineSnapshot,
  MonthlyCompensationSnapshot,
} from "@/lib/domain/payroll/provision/data";
import type { ProvisionWarning } from "@/lib/domain/payroll/provision/types";
import type { ProvisionPayrollRecord } from "../prisma-provision.repository";

export class TenantDataMismatchError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "TenantDataMismatchError";
  }
}

export function mapPayrollCompensation(
  payroll: ProvisionPayrollRecord,
  companyId: string
): MonthlyCompensationSnapshot {
  if (payroll.companyId !== companyId) {
    throw new TenantDataMismatchError(`La paie ${payroll.id} n'appartient pas au tenant demandé`);
  }

  const warnings: ProvisionWarning[] = [];
  const lines: CompensationLineSnapshot[] = payroll.earningLines.map((line) => {
    if (line.companyId !== companyId) {
      throw new TenantDataMismatchError(
        `La ligne de rémunération ${line.id} n'appartient pas au tenant demandé`
      );
    }
    if (
      line.isExpenseReimbursement &&
      (line.includedInLeaveBase || line.includedInTerminationBase)
    ) {
      throw new Error(`Le remboursement ${line.id} ne peut entrer dans une assiette de provision`);
    }
    return {
      id: line.id,
      code: line.code,
      label: line.label,
      category: line.category,
      amount: Money.of(line.amount.toString()),
      includedInLeaveBase: line.includedInLeaveBase,
      includedInTerminationBase: line.includedInTerminationBase,
      isExpenseReimbursement: line.isExpenseReimbursement,
      classificationSource: line.classificationSource,
      isEstimated: line.isEstimated,
    };
  });

  if (lines.length === 0) {
    warnings.push({
      code: "COMPENSATION_BREAKDOWN_INCOMPLETE",
      message: `La paie ${payroll.year}-${String(payroll.month).padStart(2, "0")} ne contient aucune ventilation.`,
      severity: "warning",
    });
  } else if (lines.some(({ isEstimated }) => isEstimated)) {
    warnings.push({
      code: "EXPENSE_CLASSIFICATION_UNKNOWN",
      message: `La paie ${payroll.year}-${String(payroll.month).padStart(2, "0")} contient une classification estimée.`,
      severity: "warning",
    });
  }

  const leaveEligibleGross = lines
    .filter(({ includedInLeaveBase, isExpenseReimbursement }) => includedInLeaveBase && !isExpenseReimbursement)
    .reduce((total, line) => total.add(line.amount), Money.zero());
  const terminationEligibleGross = lines
    .filter(
      ({ includedInTerminationBase, isExpenseReimbursement }) =>
        includedInTerminationBase && !isExpenseReimbursement
    )
    .reduce((total, line) => total.add(line.amount), Money.zero());

  return {
    payrollId: payroll.id,
    companyId: payroll.companyId,
    userId: payroll.userId,
    year: payroll.year,
    month: payroll.month,
    finalizedAt: payroll.finalizedAt ?? payroll.generatedAt,
    lines,
    leaveEligibleGross,
    terminationEligibleGross,
    isEstimated: lines.length === 0 || lines.some(({ isEstimated }) => isEstimated),
    warnings,
  };
}
