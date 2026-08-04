import { Money } from "../../money";
import type { MonthlyCompensationSnapshot } from "../data";
import { SalaryReference } from "../SalaryReference";

function payroll(
  year: number,
  month: number,
  leaveGross: string,
  terminationGross = leaveGross,
  estimated = false
): MonthlyCompensationSnapshot {
  return {
    payrollId: `payroll-${year}-${month}`,
    companyId: "company-a",
    userId: "employee-a",
    year,
    month,
    finalizedAt: new Date(Date.UTC(year, month, 0)),
    lines: [],
    leaveEligibleGross: Money.of(leaveGross),
    terminationEligibleGross: Money.of(terminationGross),
    isEstimated: estimated,
    warnings: estimated
      ? [{ code: "EXPENSE_CLASSIFICATION_UNKNOWN", message: "Estimation", severity: "warning" }]
      : [],
  };
}

describe("SalaryReference", () => {
  it("calcule une moyenne exacte sur douze paies", () => {
    const payrolls = Array.from({ length: 12 }, (_, index) =>
      payroll(2026, 12 - index, index === 0 ? "600000" : "300000")
    );
    const result = SalaryReference.create({
      basis: "LEAVE",
      payrolls,
      fallbackMonthlySalary: Money.zero(),
    });
    expect(result.totalEligibleCompensation.toNumber()).toBe(3_900_000);
    expect(result.averageMonthlySalary.toNumber()).toBe(325_000);
    expect(result.calculationBasis).toBe("ACTUAL_PAYROLL");
  });

  it("distingue les assiettes congés et licenciement", () => {
    const source = [payroll(2026, 12, "300000", "350000")];
    expect(SalaryReference.create({ basis: "LEAVE", payrolls: source, fallbackMonthlySalary: Money.zero() }).averageMonthlySalary.toNumber()).toBe(300_000);
    expect(SalaryReference.create({ basis: "TERMINATION", payrolls: source, fallbackMonthlySalary: Money.zero() }).averageMonthlySalary.toNumber()).toBe(350_000);
  });

  it("ne conserve que les douze périodes les plus récentes", () => {
    const payrolls = [payroll(2025, 12, "999999"), ...Array.from({ length: 12 }, (_, index) => payroll(2026, 12 - index, "300000"))];
    const result = SalaryReference.create({ basis: "LEAVE", payrolls, fallbackMonthlySalary: Money.zero() });
    expect(result.periods).toHaveLength(12);
    expect(result.averageMonthlySalary.toNumber()).toBe(300_000);
  });

  it("signale un historique inférieur à douze mois", () => {
    const result = SalaryReference.create({
      basis: "LEAVE",
      payrolls: [payroll(2026, 12, "300000")],
      fallbackMonthlySalary: Money.zero(),
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INCOMPLETE_SALARY_HISTORY" }));
  });

  it("détecte un mois manquant", () => {
    const result = SalaryReference.create({
      basis: "LEAVE",
      payrolls: [payroll(2026, 12, "300000"), payroll(2026, 10, "300000")],
      fallbackMonthlySalary: Money.zero(),
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MISSING_PAYROLL_PERIOD" }));
  });

  it("refuse deux paies pour une même période", () => {
    expect(() => SalaryReference.create({
      basis: "LEAVE",
      payrolls: [payroll(2026, 12, "300000"), payroll(2026, 12, "350000")],
      fallbackMonthlySalary: Money.zero(),
    })).toThrow("plusieurs paies");
  });

  it("utilise le salaire contractuel en l'absence de paie", () => {
    const result = SalaryReference.create({
      basis: "LEAVE",
      payrolls: [],
      fallbackMonthlySalary: Money.of(350_000),
    });
    expect(result.averageMonthlySalary.toNumber()).toBe(350_000);
    expect(result.totalEligibleCompensation.toNumber()).toBe(4_200_000);
    expect(result.calculationBasis).toBe("CONTRACT_FALLBACK");
    expect(result.warnings.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["NO_FINALIZED_PAYROLL", "CONTRACT_FALLBACK_USED"])
    );
  });

  it("propage les warnings de classification des paies", () => {
    const result = SalaryReference.create({
      basis: "LEAVE",
      payrolls: [payroll(2026, 12, "300000", "300000", true)],
      fallbackMonthlySalary: Money.zero(),
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "EXPENSE_CLASSIFICATION_UNKNOWN" }));
  });

  it("signale une moyenne nulle", () => {
    const result = SalaryReference.create({
      basis: "LEAVE",
      payrolls: [payroll(2026, 12, "0")],
      fallbackMonthlySalary: Money.zero(),
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "ZERO_AVERAGE_SALARY" }));
  });

  it("refuse une longueur de référence invalide", () => {
    expect(() => SalaryReference.create({
      basis: "LEAVE",
      payrolls: [],
      fallbackMonthlySalary: Money.zero(),
      expectedMonths: 0,
    })).toThrow(RangeError);
  });
});
