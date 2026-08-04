import { ProvisionCalculator } from "../ProvisionCalculator";
import { PROVISION_RULE_VERSION, type ProvisionCalculationInput } from "../types";

const INPUT: ProvisionCalculationInput = {
  leave: {
    userId: "employee-1",
    employeeName: "Awa Koné",
    companyId: "company-1",
    referenceDate: new Date("2026-12-31T00:00:00.000Z"),
    serviceMonths: 12,
    consumedDays: 4.96,
  },
  termination: {
    userId: "employee-1",
    employeeName: "Awa Koné",
    companyId: "company-1",
    referenceDate: new Date("2026-12-31T00:00:00.000Z"),
    seniorityMonths: 36,
    lastTwelveMonthlySalaries: Array.from({ length: 12 }, () => 300_000),
  },
};

describe("ProvisionCalculator", () => {
  it("orchestre les deux calculs et produit un total exact", () => {
    const result = new ProvisionCalculator().calculate(INPUT);
    expect(result.leave.provisionAmount).toBe(293_867);
    expect(result.termination.theoreticalExposure).toBe(270_000);
    expect(result.totalExposure.toNumber()).toBe(563_867);
  });

  it("expose la version des règles", () => {
    expect(new ProvisionCalculator().calculate(INPUT).ruleVersion).toBe(PROVISION_RULE_VERSION);
  });

  it("produit des DTO sérialisables", () => {
    const result = new ProvisionCalculator().calculate(INPUT);
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(result.leave.referenceDate).toBe("2026-12-31T00:00:00.000Z");
  });

  it("agrège les avertissements des deux calculateurs", () => {
    const result = new ProvisionCalculator().calculate({
      leave: { ...INPUT.leave, serviceMonths: 0 },
      termination: { ...INPUT.termination, seniorityMonths: 0, lastTwelveMonthlySalaries: [] },
    });
    expect(result.warnings.length).toBeGreaterThanOrEqual(4);
  });

  it("refuse des identités salariées différentes", () => {
    expect(() => new ProvisionCalculator().calculate({
      ...INPUT,
      termination: { ...INPUT.termination, userId: "employee-2" },
    })).toThrow("même salarié");
  });

  it("refuse le mélange de sociétés", () => {
    expect(() => new ProvisionCalculator().calculate({
      ...INPUT,
      termination: { ...INPUT.termination, companyId: "company-2" },
    })).toThrow("même société");
  });
});
