import Decimal from "decimal.js";
import type { CompanyProvisionV2Result } from "@/lib/domain/payroll/provision/ProvisionCalculatorV2";
import type {
  PayrollPeriodUsedDTO,
  ProvisionResponseV2,
  ProvisionWarningDTO,
} from "@/shared/types/contracts/provision.contract";

function mapWarnings(
  warnings: CompanyProvisionV2Result["warnings"]
): ProvisionWarningDTO[] {
  return warnings.map(({ code, message, severity }) => ({ code, message, severity }));
}

function mapPeriods(
  periods: CompanyProvisionV2Result["employees"][number]["leaveSalaryReference"]["periods"]
): PayrollPeriodUsedDTO[] {
  return periods.map(({ year, month, eligibleGross }) => ({
    year,
    month,
    eligibleGross: eligibleGross.toNumber(),
  }));
}

export function mapProvisionResultToV2DTO(
  result: CompanyProvisionV2Result,
  calculatedAt: Date = new Date()
): ProvisionResponseV2 {
  const leaveProvisions = result.employees.map((employee) => ({
    companyId: result.companyId,
    userId: employee.userId,
    employeeName: employee.employeeName,
    employeeId: employee.employeeId,
    referenceDate: result.referenceDate.toISOString(),
    joiningDate: employee.joiningDate.toISOString(),
    seniorityMonths: employee.terminationBenefit.seniorityMonths,
    effectiveServiceMonths: employee.leaveEntitlement.serviceMonths,
    baseAccruedDays: employee.leaveEntitlement.baseAccruedDays,
    seniorityBonusDays: employee.leaveEntitlement.seniorityBonusDays,
    openingBalanceDays: employee.leaveEntitlement.openingBalance,
    carriedForwardDays: employee.leaveEntitlement.carriedDays,
    consumedDays: employee.leaveEntitlement.consumedDays,
    compensatedDays: employee.leaveEntitlement.paidDays,
    closingBalanceDays: employee.leaveEntitlement.closingBalance,
    averageMonthlySalary: employee.leaveSalaryReference.averageMonthlySalary.toNumber(),
    dailyDivisorUsed: employee.leaveEntitlement.ruleSet.dailyDivisor,
    salaryMaintenanceDailyRate: employee.leaveProvision.dailyRate.toNumber(),
    salaryMaintenanceAmount: employee.leaveProvision.salaryMaintenanceAmount.toNumber(),
    tenthRulePeriodSalary: employee.leaveSalaryReference.totalEligibleCompensation.toNumber(),
    tenthRuleAmount: employee.leaveProvision.tenthRuleAmount.toNumber(),
    selectedMethod: employee.leaveProvision.method,
    provisionAmount: employee.leaveProvision.amount.toNumber(),
    salaryMonthsUsed: employee.leaveSalaryReference.periods.length,
    payrollPeriodsUsed: mapPeriods(employee.leaveSalaryReference.periods),
    ruleVersion: result.ruleVersion,
    warnings: mapWarnings(employee.warnings),
  }));
  const terminationBenefits = result.employees.map((employee) => ({
    companyId: result.companyId,
    userId: employee.userId,
    employeeName: employee.employeeName,
    employeeId: employee.employeeId,
    referenceDate: result.referenceDate.toISOString(),
    seniorityMonths: employee.terminationBenefit.seniorityMonths,
    seniorityYears: new Decimal(employee.terminationBenefit.seniorityMonths).dividedBy(12).toFixed(4),
    averageMonthlySalary: employee.terminationSalaryReference.averageMonthlySalary.toNumber(),
    salaryMonthsUsed: employee.terminationSalaryReference.periods.length,
    firstTrancheMonths: employee.terminationBenefit.firstTrancheMonths,
    firstTrancheAmount: employee.terminationBenefit.firstTrancheAmount.toNumber(),
    secondTrancheMonths: employee.terminationBenefit.secondTrancheMonths,
    secondTrancheAmount: employee.terminationBenefit.secondTrancheAmount.toNumber(),
    thirdTrancheMonths: employee.terminationBenefit.thirdTrancheMonths,
    thirdTrancheAmount: employee.terminationBenefit.thirdTrancheAmount.toNumber(),
    theoreticalExposure: employee.terminationBenefit.theoreticalExposure.toNumber(),
    eligible:
      employee.terminationBenefit.seniorityMonths >= employee.leaveEntitlement.ruleSet.minimumTerminationMonths,
    calculationBasis: employee.terminationSalaryReference.calculationBasis,
    payrollPeriodsUsed: mapPeriods(employee.terminationSalaryReference.periods),
    ruleVersion: result.ruleVersion,
    warnings: mapWarnings(employee.warnings),
  }));
  const allWarnings = result.employees.flatMap((employee) => employee.warnings);

  return {
    companyId: result.companyId,
    referenceDate: result.referenceDate.toISOString(),
    ruleVersion: result.ruleVersion,
    calculatedAt: calculatedAt.toISOString(),
    leaveProvisions,
    terminationBenefits,
    totalLeaveProvision: result.totalLeaveProvision.toNumber(),
    totalTerminationExposure: result.totalTerminationExposure.toNumber(),
    totalExposure: result.totalExposure.toNumber(),
    employeesProcessed: result.employees.length,
    employeesWithWarnings: result.employees.filter((employee) => employee.warnings.length > 0).length,
    warnings: mapWarnings(result.warnings),
    dataQuality: {
      completeSalaryHistories: result.employees.filter(
        (employee) =>
          employee.leaveSalaryReference.periods.length === 12 &&
          employee.terminationSalaryReference.periods.length === 12
      ).length,
      incompleteSalaryHistories: result.employees.filter(
        (employee) =>
          employee.leaveSalaryReference.periods.length > 0 &&
          employee.leaveSalaryReference.periods.length < 12
      ).length,
      contractFallbacks: result.employees.filter(
        (employee) => employee.leaveSalaryReference.calculationBasis === "CONTRACT_FALLBACK"
      ).length,
      legacyLeaveBalances: allWarnings.filter(({ code }) => code === "LEGACY_LEAVE_BALANCE_USED").length,
    },
  };
}
