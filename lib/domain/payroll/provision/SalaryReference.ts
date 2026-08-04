import { Money } from "../money";
import type { MonthlyCompensationSnapshot } from "./data";
import type { ProvisionWarning } from "./types";

export type SalaryReferenceBasis = "LEAVE" | "TERMINATION";
export type SalaryCalculationBasis = "ACTUAL_PAYROLL" | "CONTRACT_FALLBACK";

export interface SalaryReferencePeriodItem {
  readonly payrollId: string;
  readonly year: number;
  readonly month: number;
  readonly eligibleGross: Money;
  readonly isEstimated: boolean;
}

export class SalaryReference {
  private constructor(
    public readonly basis: SalaryReferenceBasis,
    public readonly periods: readonly SalaryReferencePeriodItem[],
    public readonly totalEligibleCompensation: Money,
    public readonly averageMonthlySalary: Money,
    public readonly annualReferenceCompensation: Money,
    public readonly calculationBasis: SalaryCalculationBasis,
    public readonly warnings: readonly ProvisionWarning[]
  ) {}

  public static create(params: {
    readonly basis: SalaryReferenceBasis;
    readonly payrolls: readonly MonthlyCompensationSnapshot[];
    readonly fallbackMonthlySalary: Money;
    readonly expectedMonths?: number;
  }): SalaryReference {
    const expectedMonths = params.expectedMonths ?? 12;
    if (!Number.isInteger(expectedMonths) || expectedMonths <= 0) {
      throw new RangeError("Le nombre de mois de référence doit être un entier positif");
    }

    const selected = [...params.payrolls]
      .sort((left, right) => right.year - left.year || right.month - left.month)
      .slice(0, expectedMonths);
    const periods = selected.map((payroll) => ({
      payrollId: payroll.payrollId,
      year: payroll.year,
      month: payroll.month,
      eligibleGross:
        params.basis === "LEAVE" ? payroll.leaveEligibleGross : payroll.terminationEligibleGross,
      isEstimated: payroll.isEstimated,
    }));
    const warnings: ProvisionWarning[] = selected.flatMap(({ warnings: payrollWarnings }) => payrollWarnings);
    const periodKeys = new Set(periods.map(({ year, month }) => `${year}-${month}`));
    if (periodKeys.size !== periods.length) {
      throw new Error("La période salariale contient plusieurs paies pour un même mois");
    }
    const hasGap = periods.slice(1).some((period, index) => {
      const previous = periods[index];
      const expectedPreviousMonth = previous.month === 1
        ? { year: previous.year - 1, month: 12 }
        : { year: previous.year, month: previous.month - 1 };
      return period.year !== expectedPreviousMonth.year || period.month !== expectedPreviousMonth.month;
    });
    if (hasGap) {
      warnings.push({
        code: "MISSING_PAYROLL_PERIOD",
        message: "Une ou plusieurs périodes mensuelles sont absentes de l'historique salarial.",
        severity: "warning",
      });
    }

    if (periods.length === 0) {
      warnings.push({
        code: "NO_FINALIZED_PAYROLL",
        message: "Aucune paie finalisée n'est disponible dans la période de référence.",
        severity: "warning",
      });
      warnings.push({
        code: "CONTRACT_FALLBACK_USED",
        message: "Le salaire contractuel courant est utilisé comme base estimative.",
        severity: "warning",
      });
      const annualFallback = params.fallbackMonthlySalary.multiply(expectedMonths);
      return new SalaryReference(
        params.basis,
        [],
        annualFallback,
        params.fallbackMonthlySalary,
        annualFallback,
        "CONTRACT_FALLBACK",
        warnings
      );
    }

    if (periods.length < expectedMonths) {
      warnings.push({
        code: "INCOMPLETE_SALARY_HISTORY",
        message: `La moyenne repose sur ${periods.length} mois au lieu de ${expectedMonths}.`,
        severity: "warning",
      });
    }

    const total = periods.reduce((sum, period) => sum.add(period.eligibleGross), Money.zero());
    const average = total.divide(periods.length);
    if (average.isZero()) {
      warnings.push({
        code: "ZERO_AVERAGE_SALARY",
        message: "Le salaire mensuel moyen de référence est nul.",
        severity: "warning",
      });
    }

    return new SalaryReference(
      params.basis,
      periods,
      total,
      average,
      average.multiply(expectedMonths),
      "ACTUAL_PAYROLL",
      warnings
    );
  }
}
