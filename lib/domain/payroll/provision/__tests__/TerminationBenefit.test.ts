import { TerminationBenefit } from "../TerminationBenefit";
import type { TerminationBenefitInput } from "../types";

const salaries = Array.from({ length: 12 }, () => 400_000);
const BASE_INPUT: TerminationBenefitInput = {
  userId: "employee-1",
  employeeName: "Awa Koné",
  companyId: "company-1",
  referenceDate: new Date("2026-12-31T00:00:00.000Z"),
  seniorityMonths: 36,
  lastTwelveMonthlySalaries: salaries,
};

describe("TerminationBenefit", () => {
  it("applique 30 % pour trois ans d'ancienneté", () => {
    const result = TerminationBenefit.calculate(BASE_INPUT);
    expect(result.firstTrancheAmount.toNumber()).toBe(360_000);
    expect(result.theoreticalExposure.toNumber()).toBe(360_000);
  });

  it("borne exactement la première tranche à cinq ans", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, seniorityMonths: 60 });
    expect(result.firstTrancheAmount.toNumber()).toBe(600_000);
    expect(result.secondTrancheAmount.toNumber()).toBe(0);
  });

  it("applique 35 % entre six et dix ans", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, seniorityMonths: 96 });
    expect(result.firstTrancheAmount.toNumber()).toBe(600_000);
    expect(result.secondTrancheAmount.toNumber()).toBe(420_000);
    expect(result.theoreticalExposure.toNumber()).toBe(1_020_000);
  });

  it("borne exactement la deuxième tranche à dix ans", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, seniorityMonths: 120 });
    expect(result.secondTrancheAmount.toNumber()).toBe(700_000);
    expect(result.thirdTrancheAmount.toNumber()).toBe(0);
  });

  it("applique 40 % au-delà de dix ans", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, seniorityMonths: 180 });
    expect(result.thirdTrancheAmount.toNumber()).toBe(800_000);
    expect(result.theoreticalExposure.toNumber()).toBe(2_100_000);
  });

  it("ne calcule aucune exposition avant un an", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, seniorityMonths: 11 });
    expect(result.theoreticalExposure.toNumber()).toBe(0);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INSUFFICIENT_SENIORITY" }));
  });

  it("calcule la moyenne des douze derniers salaires", () => {
    const history = [...Array.from({ length: 11 }, () => 300_000), 600_000];
    expect(TerminationBenefit.calculate({ ...BASE_INPUT, lastTwelveMonthlySalaries: history }).averageMonthlySalary.toNumber()).toBe(325_000);
  });

  it("ignore les salaires antérieurs aux douze derniers mois", () => {
    const history = [9_999_999, ...salaries];
    expect(TerminationBenefit.calculate({ ...BASE_INPUT, lastTwelveMonthlySalaries: history }).averageMonthlySalary.toNumber()).toBe(400_000);
  });

  it("signale un historique incomplet", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, lastTwelveMonthlySalaries: [400_000] });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INCOMPLETE_SALARY_HISTORY" }));
  });

  it("signale un historique absent et un salaire moyen nul", () => {
    const result = TerminationBenefit.calculate({ ...BASE_INPUT, lastTwelveMonthlySalaries: [] });
    expect(result.warnings.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "MISSING_SALARY_HISTORY",
      "ZERO_AVERAGE_SALARY",
    ]));
  });

  it("signale une moyenne salariale nulle", () => {
    const result = TerminationBenefit.calculate({
      ...BASE_INPUT,
      lastTwelveMonthlySalaries: Array.from({ length: 12 }, () => 0),
    });
    expect(result.theoreticalExposure.toNumber()).toBe(0);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "ZERO_AVERAGE_SALARY" }));
  });

  it("refuse une ancienneté négative", () => {
    expect(() => TerminationBenefit.calculate({ ...BASE_INPUT, seniorityMonths: -1 })).toThrow(RangeError);
  });
});
