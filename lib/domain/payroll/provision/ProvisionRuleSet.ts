export type DecimalRate = `${number}`;
export type LeaveDailyDivisor = 26 | 30;
export type LeaveValuationMethod = "TENTH" | "SALARY_MAINTENANCE";

export interface SeniorityBonusRule {
  readonly minYears: number;
  readonly maxYears: number | null;
  readonly bonusDays: number;
}

export interface TerminationTrancheRule {
  readonly minMonths: number;
  readonly maxMonths: number | null;
  readonly rate: DecimalRate;
}

export interface ProvisionRuleSet {
  readonly version: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly jurisdiction: "CI";
  readonly collectiveAgreement: string;
  readonly leaveAccrualRate: DecimalRate;
  readonly leaveDayUnit: "WORKING_DAY";
  readonly leaveRoundingMode: "CEILING" | "FLOOR" | "HALF_UP";
  readonly dailyDivisor: LeaveDailyDivisor;
  readonly leaveValuationMethods: readonly LeaveValuationMethod[];
  readonly seniorityBonusSchedule: readonly SeniorityBonusRule[];
  readonly minimumTerminationMonths: 12;
  readonly terminationTranches: readonly TerminationTrancheRule[];
  readonly salaryLookbackMonths: 12;
  readonly includePartialYears: true;
  readonly partialYearRounding: "FLOOR_MONTH";
  readonly carriedDaysValuation: "CURRENT_SALARY";
  readonly tenthRuleProration: "CLOSING_BALANCE_OVER_PERIOD_RIGHTS";
}

export const PROVISION_V2_RULE_SET: Readonly<ProvisionRuleSet> = Object.freeze({
  version: "CI-CCI-1977-PROVISIONS-2026.2",
  effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
  effectiveTo: null,
  jurisdiction: "CI",
  collectiveAgreement: "Convention collective interprofessionnelle de Côte d'Ivoire (1977)",
  leaveAccrualRate: "2.2",
  leaveDayUnit: "WORKING_DAY",
  leaveRoundingMode: "CEILING",
  dailyDivisor: 26,
  leaveValuationMethods: Object.freeze(["TENTH", "SALARY_MAINTENANCE"] as const),
  seniorityBonusSchedule: Object.freeze([
    Object.freeze({ minYears: 0, maxYears: 5, bonusDays: 0 }),
    Object.freeze({ minYears: 5, maxYears: 10, bonusDays: 1 }),
    Object.freeze({ minYears: 10, maxYears: 15, bonusDays: 2 }),
    Object.freeze({ minYears: 15, maxYears: 20, bonusDays: 3 }),
    Object.freeze({ minYears: 20, maxYears: 25, bonusDays: 5 }),
    Object.freeze({ minYears: 25, maxYears: 30, bonusDays: 7 }),
    Object.freeze({ minYears: 30, maxYears: null, bonusDays: 8 }),
  ] as const),
  minimumTerminationMonths: 12,
  terminationTranches: Object.freeze([
    Object.freeze({ minMonths: 0, maxMonths: 60, rate: "0.30" }),
    Object.freeze({ minMonths: 60, maxMonths: 120, rate: "0.35" }),
    Object.freeze({ minMonths: 120, maxMonths: null, rate: "0.40" }),
  ] as const),
  salaryLookbackMonths: 12,
  includePartialYears: true,
  partialYearRounding: "FLOOR_MONTH",
  carriedDaysValuation: "CURRENT_SALARY",
  tenthRuleProration: "CLOSING_BALANCE_OVER_PERIOD_RIGHTS",
});

export function getSeniorityBonusDays(
  seniorityYears: number,
  ruleSet: ProvisionRuleSet = PROVISION_V2_RULE_SET
): number {
  if (!Number.isFinite(seniorityYears) || seniorityYears < 0) {
    throw new RangeError("L'ancienneté doit être positive et finie");
  }
  return ruleSet.seniorityBonusSchedule.find(
    ({ minYears, maxYears }) => seniorityYears >= minYears && (maxYears === null || seniorityYears < maxYears)
  )?.bonusDays ?? 0;
}
