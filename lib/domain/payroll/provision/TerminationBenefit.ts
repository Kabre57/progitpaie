import Decimal from "decimal.js";
import { Money } from "../money";
import type { ProvisionWarning, TerminationBenefitInput } from "./types";
import { PROVISION_V2_RULE_SET } from "./ProvisionRuleSet";

const MonthDecimal = Decimal.clone({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
const MONTHS_PER_YEAR = new MonthDecimal(12);

export class TerminationBenefit {
  private constructor(
    public readonly userId: string,
    public readonly employeeName: string,
    public readonly companyId: string,
    public readonly referenceDate: Date,
    public readonly seniorityMonths: number,
    public readonly averageMonthlySalary: Money,
    public readonly firstTrancheMonths: number,
    public readonly firstTrancheAmount: Money,
    public readonly secondTrancheMonths: number,
    public readonly secondTrancheAmount: Money,
    public readonly thirdTrancheMonths: number,
    public readonly thirdTrancheAmount: Money,
    public readonly theoreticalExposure: Money,
    public readonly warnings: readonly ProvisionWarning[]
  ) {}

  public static calculate(input: TerminationBenefitInput): TerminationBenefit {
    const seniorityMonths = new MonthDecimal(input.seniorityMonths);
    const ruleSet = input.ruleSet ?? PROVISION_V2_RULE_SET;
    if (!seniorityMonths.isFinite() || seniorityMonths.isNegative()) {
      throw new RangeError("L'ancienneté doit être positive et finie");
    }

    const salaries = input.lastTwelveMonthlySalaries.slice(-12).map(Money.of);
    const warnings: ProvisionWarning[] = [];
    const averageMonthlySalary = salaries.length === 0
      ? Money.zero()
      : salaries.reduce((total, salary) => total.add(salary), Money.zero()).divide(salaries.length);

    if (salaries.length === 0) {
      warnings.push({
        code: "MISSING_SALARY_HISTORY",
        message: "Aucun salaire n'est disponible pour établir la moyenne de référence.",
        severity: "warning",
      });
    } else if (salaries.length < 12) {
      warnings.push({
        code: "INCOMPLETE_SALARY_HISTORY",
        message: `La moyenne repose sur ${salaries.length} mois au lieu de 12.`,
        severity: "warning",
      });
    }
    if (averageMonthlySalary.isZero()) {
      warnings.push({
        code: "ZERO_AVERAGE_SALARY",
        message: "Le salaire mensuel moyen est nul.",
        severity: "warning",
      });
    }

    let firstTrancheAmount = Money.zero();
    let secondTrancheAmount = Money.zero();
    let thirdTrancheAmount = Money.zero();
    let firstTrancheMonths = new MonthDecimal(0);
    let secondTrancheMonths = new MonthDecimal(0);
    let thirdTrancheMonths = new MonthDecimal(0);

    if (seniorityMonths.lessThan(ruleSet.minimumTerminationMonths)) {
      warnings.push({
        code: "INSUFFICIENT_SENIORITY",
        message: "Une ancienneté inférieure à un an ne déclenche aucune exposition théorique.",
        severity: "info",
      });
    } else {
      const trancheCalculations = ruleSet.terminationTranches.map(({ minMonths, maxMonths, rate }) => {
        const months = Decimal.max(
          0,
          Decimal.min(
            seniorityMonths.minus(minMonths),
            maxMonths === null ? seniorityMonths : maxMonths - minMonths
          )
        );
        return {
          months,
          amount: averageMonthlySalary.multiply(months.dividedBy(MONTHS_PER_YEAR)).multiply(rate),
        };
      });
      firstTrancheMonths = trancheCalculations[0]?.months ?? new MonthDecimal(0);
      secondTrancheMonths = trancheCalculations[1]?.months ?? new MonthDecimal(0);
      thirdTrancheMonths = trancheCalculations[2]?.months ?? new MonthDecimal(0);
      firstTrancheAmount = trancheCalculations[0]?.amount ?? Money.zero();
      secondTrancheAmount = trancheCalculations[1]?.amount ?? Money.zero();
      thirdTrancheAmount = trancheCalculations[2]?.amount ?? Money.zero();
    }

    const theoreticalExposure = firstTrancheAmount.add(secondTrancheAmount).add(thirdTrancheAmount);
    return new TerminationBenefit(
      input.userId,
      input.employeeName,
      input.companyId,
      new Date(input.referenceDate),
      seniorityMonths.toDecimalPlaces(2).toNumber(),
      averageMonthlySalary,
      firstTrancheMonths.toDecimalPlaces(2).toNumber(),
      firstTrancheAmount,
      secondTrancheMonths.toDecimalPlaces(2).toNumber(),
      secondTrancheAmount,
      thirdTrancheMonths.toDecimalPlaces(2).toNumber(),
      thirdTrancheAmount,
      theoreticalExposure,
      warnings
    );
  }
}
