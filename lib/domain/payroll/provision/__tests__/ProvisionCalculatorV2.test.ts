import { Money } from "../../money";
import type { ProvisionEmployeeAggregate } from "../data";
import { ProvisionCalculatorV2 } from "../ProvisionCalculatorV2";

function aggregate(overrides: Partial<ProvisionEmployeeAggregate> = {}): ProvisionEmployeeAggregate {
  return {
    employee: {
      id: "employee-a",
      companyId: "company-a",
      name: "Awa Koné",
      employeeId: "EMP-001",
      joiningDate: new Date("2020-01-01T00:00:00.000Z"),
      exitDate: null,
      currentBaseSalary: Money.of(300_000),
      currentSursalaire: Money.of(50_000),
      probationMonths: 3,
    },
    payrolls: [],
    leaveLedger: [
      {
        id: "opening-1",
        companyId: "company-a",
        userId: "employee-a",
        effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
        referencePeriod: "MIGRATION-2026",
        entryType: "OPENING_BALANCE",
        days: "20.0000",
        sourceType: "MIGRATION",
        sourceId: "employee-a",
        ruleVersion: "LEGACY-BALANCE-MIGRATION-2026.1",
        isEstimated: true,
      },
    ],
    ...overrides,
  };
}

describe("ProvisionCalculatorV2", () => {
  const referenceDate = new Date("2026-12-31T23:59:59.000Z");

  it("utilise le fallback contractuel sans valeur arbitraire", () => {
    const result = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [aggregate()]);
    const [employee] = result.employees;
    expect(employee.leaveSalaryReference.averageMonthlySalary.toNumber()).toBe(350_000);
    expect(employee.leaveSalaryReference.calculationBasis).toBe("CONTRACT_FALLBACK");
  });

  it("applique 2,2 jours par mois et le bonus du palier de cinq ans", () => {
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [aggregate()]).employees;
    expect(employee.leaveEntitlement.baseAccruedDays).toBe(26.4);
    expect(employee.leaveEntitlement.seniorityBonusDays).toBe(1);
    expect(employee.leaveEntitlement.accruedDays).toBe(28);
  });

  it("n'exclut pas une ancienne période d'essai de l'exercice courant", () => {
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [aggregate()]).employees;
    expect(employee.leaveEntitlement.serviceMonths).toBe(12);
  });

  it("produit des totaux Money cohérents", () => {
    const result = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [aggregate()]);
    expect(result.totalExposure.equals(
      result.totalLeaveProvision.add(result.totalTerminationExposure)
    )).toBe(true);
  });

  it("expose la version V2 des règles", () => {
    expect(new ProvisionCalculatorV2().calculate("company-a", referenceDate, []).ruleVersion).toBe(
      "CI-CCI-1977-PROVISIONS-2026.2"
    );
  });

  it("signale l'utilisation d'un solde historique", () => {
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [aggregate()]).employees;
    expect(employee.warnings).toContainEqual(expect.objectContaining({ code: "LEGACY_LEAVE_BALANCE_USED" }));
  });

  it("signale la valorisation courante des reports", () => {
    const source = aggregate({
      leaveLedger: [
        ...aggregate().leaveLedger,
        { ...aggregate().leaveLedger[0], id: "carry-1", entryType: "CARRY_FORWARD", days: "3.0000" },
      ],
    });
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source]).employees;
    expect(employee.warnings).toContainEqual(
      expect.objectContaining({ code: "CARRIED_DAYS_VALUED_AT_CURRENT_RATE" })
    );
  });

  it("rejette un agrégat provenant d'un autre tenant", () => {
    const source = aggregate({ employee: { ...aggregate().employee, companyId: "company-b" } });
    expect(() => new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source])).toThrow(
      "tenant demandé"
    );
  });

  it("utilise les paies finalisées lorsqu'elles sont disponibles", () => {
    const base = aggregate();
    const source = aggregate({
      payrolls: [
        {
          payrollId: "payroll-1",
          companyId: "company-a",
          userId: "employee-a",
          year: 2026,
          month: 12,
          finalizedAt: referenceDate,
          lines: [],
          leaveEligibleGross: Money.of(420_000),
          terminationEligibleGross: Money.of(450_000),
          isEstimated: false,
          warnings: [],
        },
      ],
      leaveLedger: base.leaveLedger,
    });
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source]).employees;
    expect(employee.leaveSalaryReference.averageMonthlySalary.toNumber()).toBe(420_000);
    expect(employee.terminationSalaryReference.averageMonthlySalary.toNumber()).toBe(450_000);
    expect(employee.terminationSalaryReference.calculationBasis).toBe("ACTUAL_PAYROLL");
  });

  it("exclut uniquement la période d'essai qui chevauche l'exercice", () => {
    const source = aggregate({
      employee: {
        ...aggregate().employee,
        joiningDate: new Date("2026-01-01T00:00:00.000Z"),
        probationMonths: 3,
      },
      leaveLedger: [],
    });
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source]).employees;
    expect(employee.leaveEntitlement.serviceMonths).toBeCloseTo(9, 1);
  });

  it("borne le service à la date de sortie", () => {
    const source = aggregate({
      employee: {
        ...aggregate().employee,
        exitDate: new Date("2026-06-30T00:00:00.000Z"),
        probationMonths: 0,
      },
      leaveLedger: [],
    });
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source]).employees;
    expect(employee.leaveEntitlement.serviceMonths).toBeCloseTo(6.03, 1);
  });

  it("retourne zéro service pour une embauche postérieure à la référence", () => {
    const source = aggregate({
      employee: {
        ...aggregate().employee,
        joiningDate: new Date("2027-01-01T00:00:00.000Z"),
        probationMonths: 0,
      },
      leaveLedger: [],
    });
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source]).employees;
    expect(employee.leaveEntitlement.serviceMonths).toBe(0);
    expect(employee.terminationBenefit.theoreticalExposure.toNumber()).toBe(0);
  });

  it("rejoue les congés consommés et compensés", () => {
    const opening = aggregate().leaveLedger[0];
    const source = aggregate({
      leaveLedger: [
        opening,
        { ...opening, id: "consumed", entryType: "LEAVE_CONSUMED", days: "5.0000", ruleVersion: "V2" },
        { ...opening, id: "paid", entryType: "LEAVE_COMPENSATED", days: "2.0000", ruleVersion: "V2" },
      ],
    });
    const [employee] = new ProvisionCalculatorV2().calculate("company-a", referenceDate, [source]).employees;
    expect(employee.leaveEntitlement.consumedDays).toBe(5);
    expect(employee.leaveEntitlement.paidDays).toBe(2);
  });
});
