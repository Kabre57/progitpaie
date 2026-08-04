import type {
  ProvisionResponse,
  ProvisionResponseV2,
} from "@/shared/types/contracts/provision.contract";

/**
 * Compatibility-only projection for consumers of /api/payroll/provisions.
 * Financial values are copied from V2; this mapper must never recalculate them.
 */
export function mapProvisionV2ToLegacy(
  source: ProvisionResponseV2,
  year: number
): ProvisionResponse {
  return {
    companyId: source.companyId,
    year,
    leaveProvisions: source.leaveProvisions.map((provision) => ({
      userId: provision.userId,
      name: provision.employeeName,
      employeeId: provision.employeeId,
      joiningDate: provision.joiningDate,
      grossMonthly: provision.averageMonthlySalary,
      leaveDaysAccrued: provision.closingBalanceDays,
      provisionAmount: provision.provisionAmount,
    })),
    totalLeaveProvision: source.totalLeaveProvision,
    retirementProvisions: source.terminationBenefits.map((benefit) => ({
      userId: benefit.userId,
      name: benefit.employeeName,
      employeeId: benefit.employeeId,
      joiningDate: source.leaveProvisions.find(({ userId }) => userId === benefit.userId)?.joiningDate
        ?? source.referenceDate,
      seniorityYears: Number(benefit.seniorityYears),
      grossMonthly: benefit.averageMonthlySalary,
      provisionAmount: benefit.theoreticalExposure,
    })),
    totalRetirementProvision: source.totalTerminationExposure,
    total: source.totalExposure,
  };
}
