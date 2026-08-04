import { LeaveEntitlement } from "./LeaveEntitlement";
import { TerminationBenefit } from "./TerminationBenefit";
import {
  PROVISION_RULE_VERSION,
  type ProvisionCalculationInput,
  type ProvisionCalculationResult,
} from "./types";

export class ProvisionCalculator {
  public calculate(input: ProvisionCalculationInput): ProvisionCalculationResult {
    if (input.leave.userId !== input.termination.userId) {
      throw new Error("Les données de congés et de rupture doivent concerner le même salarié");
    }
    if (input.leave.companyId !== input.termination.companyId) {
      throw new Error("Les données de provision doivent appartenir à la même société");
    }

    const leave = LeaveEntitlement.createFrom(input.leave);
    const termination = TerminationBenefit.calculate(input.termination);
    const leaveProvision = leave.getProvision(termination.averageMonthlySalary);
    const warnings = [...leave.warnings, ...termination.warnings];

    return {
      ruleVersion: PROVISION_RULE_VERSION,
      calculatedAt: new Date().toISOString(),
      leave: {
        userId: leave.userId,
        employeeName: leave.employeeName,
        companyId: leave.companyId,
        referenceDate: leave.referenceDate.toISOString(),
        serviceMonths: leave.serviceMonths,
        openingBalance: leave.openingBalance,
        accruedDays: leave.accruedDays,
        consumedDays: leave.consumedDays,
        paidDays: leave.paidDays,
        closingBalance: leave.closingBalance,
        provisionAmount: leaveProvision.amount.toNumber(),
        provisionMethod: leaveProvision.method,
        warnings: leave.warnings,
      },
      termination: {
        userId: termination.userId,
        employeeName: termination.employeeName,
        companyId: termination.companyId,
        referenceDate: termination.referenceDate.toISOString(),
        seniorityMonths: termination.seniorityMonths,
        averageMonthlySalary: termination.averageMonthlySalary.toNumber(),
        firstTrancheAmount: termination.firstTrancheAmount.toNumber(),
        secondTrancheAmount: termination.secondTrancheAmount.toNumber(),
        thirdTrancheAmount: termination.thirdTrancheAmount.toNumber(),
        theoreticalExposure: termination.theoreticalExposure.toNumber(),
        warnings: termination.warnings,
      },
      totalExposure: leaveProvision.amount.add(termination.theoreticalExposure),
      warnings,
    };
  }
}
