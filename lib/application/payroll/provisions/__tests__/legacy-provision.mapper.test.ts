import type { ProvisionResponseV2 } from "@/shared/types/contracts/provision.contract";
import { mapProvisionV2ToLegacy } from "../legacy-provision.mapper";

const source: ProvisionResponseV2 = {
  companyId: "company-a",
  referenceDate: "2025-12-31T23:59:59.999Z",
  ruleVersion: "rules-v2",
  calculatedAt: "2026-01-01T00:00:00.000Z",
  leaveProvisions: [{
    companyId: "company-a", userId: "user-a", employeeName: "Awa Koné", employeeId: "EMP-1",
    referenceDate: "2025-12-31T23:59:59.999Z", joiningDate: "2020-01-01T00:00:00.000Z",
    seniorityMonths: 72, effectiveServiceMonths: 12, baseAccruedDays: 26.4, seniorityBonusDays: 1,
    openingBalanceDays: 0, carriedForwardDays: 0, consumedDays: 4, compensatedDays: 2,
    closingBalanceDays: 21.4, averageMonthlySalary: 400_000, dailyDivisorUsed: 26,
    salaryMaintenanceDailyRate: 15_384.62, salaryMaintenanceAmount: 329_230.87,
    tenthRulePeriodSalary: 4_800_000, tenthRuleAmount: 480_000, selectedMethod: "TENTH",
    provisionAmount: 480_000, salaryMonthsUsed: 12, payrollPeriodsUsed: [], ruleVersion: "rules-v2", warnings: [],
  }],
  terminationBenefits: [{
    companyId: "company-a", userId: "user-a", employeeName: "Awa Koné", employeeId: "EMP-1",
    referenceDate: "2025-12-31T23:59:59.999Z", seniorityMonths: 72, seniorityYears: "6.0000",
    averageMonthlySalary: 400_000, salaryMonthsUsed: 12, firstTrancheMonths: 60,
    firstTrancheAmount: 600_000, secondTrancheMonths: 12, secondTrancheAmount: 140_000,
    thirdTrancheMonths: 0, thirdTrancheAmount: 0, theoreticalExposure: 740_000, eligible: true,
    calculationBasis: "ACTUAL_PAYROLL", payrollPeriodsUsed: [], ruleVersion: "rules-v2", warnings: [],
  }],
  totalLeaveProvision: 480_000,
  totalTerminationExposure: 740_000,
  totalExposure: 1_220_000,
  employeesProcessed: 1,
  employeesWithWarnings: 0,
  warnings: [],
  dataQuality: { completeSalaryHistories: 1, incompleteSalaryHistories: 0, contractFallbacks: 0, legacyLeaveBalances: 0 },
};

describe("mapProvisionV2ToLegacy", () => {
  it("projette le contrat V2 sans recalculer les montants", () => {
    const result = mapProvisionV2ToLegacy(source, 2025);
    expect(result).toEqual(expect.objectContaining({
      companyId: "company-a",
      year: 2025,
      totalLeaveProvision: 480_000,
      totalRetirementProvision: 740_000,
      total: 1_220_000,
    }));
    expect(result.leaveProvisions[0]).toEqual(expect.objectContaining({
      grossMonthly: 400_000,
      leaveDaysAccrued: 21.4,
      provisionAmount: 480_000,
    }));
    expect(result.retirementProvisions[0]).toEqual(expect.objectContaining({
      seniorityYears: 6,
      grossMonthly: 400_000,
      provisionAmount: 740_000,
    }));
  });

  it("ne modifie pas la source V2", () => {
    const before = JSON.stringify(source);
    mapProvisionV2ToLegacy(source, 2025);
    expect(JSON.stringify(source)).toBe(before);
  });
});
