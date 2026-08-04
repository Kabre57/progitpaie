import Decimal from "decimal.js";
import { Money } from "../money";
import type { LeaveEntitlementInput, ProvisionWarning } from "./types";
import {
  getSeniorityBonusDays,
  PROVISION_V2_RULE_SET,
  type ProvisionRuleSet,
} from "./ProvisionRuleSet";

const DayDecimal = Decimal.clone({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
const DAYS_PER_MONTH = new DayDecimal(30);

function days(value: Decimal.Value | undefined): Decimal {
  const result = new DayDecimal(value ?? 0);
  if (!result.isFinite() || result.isNegative()) {
    throw new RangeError("Les valeurs du registre de congés doivent être positives et finies");
  }
  return result;
}

function roundedDays(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

function applyEntitlementRounding(
  value: Decimal,
  mode: ProvisionRuleSet["leaveRoundingMode"]
): Decimal {
  if (mode === "CEILING") return value.ceil();
  if (mode === "FLOOR") return value.floor();
  return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export class LeaveEntitlement {
  private constructor(
    public readonly userId: string,
    public readonly employeeName: string,
    public readonly companyId: string,
    public readonly referenceDate: Date,
    public readonly serviceMonths: number,
    public readonly openingBalance: number,
    public readonly carriedDays: number,
    public readonly baseAccruedDays: number,
    public readonly seniorityBonusDays: number,
    public readonly accruedDays: number,
    public readonly consumedDays: number,
    public readonly paidDays: number,
    public readonly closingBalance: number,
    public readonly warnings: readonly ProvisionWarning[],
    public readonly ruleSet: ProvisionRuleSet
  ) {}

  public static createFrom(input: LeaveEntitlementInput): LeaveEntitlement {
    const serviceMonths = days(input.serviceMonths);
    const seniorityMonths = days(input.seniorityMonths ?? input.serviceMonths);
    const ruleSet = input.ruleSet ?? PROVISION_V2_RULE_SET;
    const probationMonths = days(input.probationMonths);
    const absenceMonths = days(input.unjustifiedAbsenceDays).dividedBy(DAYS_PER_MONTH);
    const effectiveMonths = Decimal.max(0, serviceMonths.minus(probationMonths).minus(absenceMonths));
    const openingBalance = days(input.openingBalance);
    const carriedDays = days(input.carriedDays);
    const baseAccruedDays = effectiveMonths.times(ruleSet.leaveAccrualRate);
    const seniorityBonusDays = new DayDecimal(
      getSeniorityBonusDays(seniorityMonths.dividedBy(12).toNumber(), ruleSet)
    );
    const accruedDays = applyEntitlementRounding(
      baseAccruedDays,
      ruleSet.leaveRoundingMode
    ).plus(seniorityBonusDays);
    const consumedDays = days(input.consumedDays);
    const paidDays = days(input.paidDays);
    const closingBalance = openingBalance
      .plus(carriedDays)
      .plus(accruedDays)
      .minus(consumedDays)
      .minus(paidDays);
    const warnings: ProvisionWarning[] = [];

    if (effectiveMonths.isZero()) {
      warnings.push({
        code: "NO_EFFECTIVE_SERVICE",
        message: "Aucun mois de service effectif n'ouvre de droits à la date de référence.",
        severity: "info",
      });
    }
    if (closingBalance.isNegative()) {
      warnings.push({
        code: "NEGATIVE_LEAVE_BALANCE",
        message: "Les jours consommés ou payés dépassent les droits disponibles.",
        severity: "warning",
      });
    }

    return new LeaveEntitlement(
      input.userId,
      input.employeeName,
      input.companyId,
      new Date(input.referenceDate),
      roundedDays(effectiveMonths),
      roundedDays(openingBalance),
      roundedDays(carriedDays),
      roundedDays(baseAccruedDays),
      roundedDays(seniorityBonusDays),
      roundedDays(accruedDays),
      roundedDays(consumedDays),
      roundedDays(paidDays),
      roundedDays(closingBalance),
      warnings,
      ruleSet
    );
  }

  public getProvision(avgMonthlySalary: Money): {
    readonly amount: Money;
    readonly method: "TENTH" | "SALARY_MAINTENANCE";
  } {
    return this.getProvisionDetails(avgMonthlySalary, avgMonthlySalary.multiply(12));
  }

  public getProvisionDetails(
    avgMonthlySalary: Money,
    referencePeriodSalary: Money
  ): {
    readonly amount: Money;
    readonly method: "TENTH" | "SALARY_MAINTENANCE";
    readonly dailyRate: Money;
    readonly salaryMaintenanceAmount: Money;
    readonly tenthRuleAmount: Money;
  } {
    const payableDays = Decimal.max(0, new DayDecimal(this.closingBalance));
    const dailyRate = avgMonthlySalary.divide(this.ruleSet.dailyDivisor);
    if (payableDays.isZero() || avgMonthlySalary.isZero()) {
      return {
        amount: Money.zero(),
        method: "SALARY_MAINTENANCE",
        dailyRate,
        salaryMaintenanceAmount: Money.zero(),
        tenthRuleAmount: Money.zero(),
      };
    }

    const maintenance = dailyRate.multiply(payableDays);
    const periodRights = Decimal.max(new DayDecimal(this.accruedDays), 1);
    const tenth = referencePeriodSalary.percentage(10).multiply(payableDays.dividedBy(periodRights));

    return {
      amount: tenth.greaterThan(maintenance) ? tenth : maintenance,
      method: tenth.greaterThan(maintenance) ? "TENTH" : "SALARY_MAINTENANCE",
      dailyRate,
      salaryMaintenanceAmount: maintenance,
      tenthRuleAmount: tenth,
    };
  }

  public getProvisionAmount(avgMonthlySalary: Money): Money {
    return this.getProvision(avgMonthlySalary).amount;
  }
}
