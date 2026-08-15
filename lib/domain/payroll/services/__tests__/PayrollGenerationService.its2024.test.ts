import { PayrollGenerationService } from "../PayrollGenerationService";
import { PayrollPeriod } from "../../value-objects/PayrollPeriod";
import { CI_ITS_2024_RULE } from "../../rules/ci-its-2024-rule";

describe("PayrollGenerationService — règle CI-ITS-2024", () => {
  const service = new PayrollGenerationService();
  const period = PayrollPeriod.create(7, 2026);

  function generate(
    salary: number,
    attendance: ReadonlyArray<{ date: string; status: string; overtimeMinutes?: number; overtimeRate?: number }> = [],
    options: Partial<{ transportAllowance: number; housingAllowance: number; partsIGR: number; unpaidLeaveDays: number }> = {}
  ) {
    return service.generateForEmployee(
      {
        id: "employee-its-2024",
        companyId: "company-ci",
        employeeId: "EMP-ITS-2024",
        name: "Salarié de référence",
        salary,
        transportAllowance: options.transportAllowance ?? 0,
        housingAllowance: options.housingAllowance ?? 0,
        partsIGR: options.partsIGR ?? 1,
      },
      period,
      attendance,
      options.unpaidLeaveDays ?? 0,
      "snapshot-ci-its-2024"
    );
  }

  it("applique l’ITS unique 2024 aux bulletins réels et annule les champs IGR autonomes", () => {
    const payroll = generate(500_000);

    expect(service.getRuleVersion()).toBe(CI_ITS_2024_RULE.id);
    expect(payroll.grossSalary.toNumber()).toBe(500_000);
    expect(payroll.cnpsEmployee.toNumber()).toBe(31_500);
    expect(payroll.itsTax.toNumber()).toBe(74_385);
    expect(payroll.igrTax.toNumber()).toBe(0);
    expect(payroll.totalDeductions.toNumber()).toBe(106_385);
    expect(payroll.netSalary.toNumber()).toBe(393_615);
  });

  it("plafonne la CNPS retraite à 3 375 000 FCFA", () => {
    const payroll = generate(4_000_000);

    expect(payroll.cnpsEmployee.toNumber()).toBe(212_625);
    // Retraite plafonnée (259 875) + PF (4 025) + AT (2 100).
    expect(payroll.cnpsEmployer.toNumber()).toBe(266_000);
  });

  it("retire la fraction transport exonérée de la base ITS tout en la conservant dans le net", () => {
    const payroll = generate(75_000, [], { transportAllowance: 30_000 });

    expect(payroll.grossSalary.toNumber()).toBe(105_000);
    expect(payroll.cnpsEmployee.toNumber()).toBe(4_725);
    expect(payroll.itsTax.toNumber()).toBe(0);
    expect(payroll.netSalary.toNumber()).toBe(99_775);
  });

  it("applique les retenues de présence une seule fois avant les cotisations et l’ITS", () => {
    const payroll = generate(260_000, [{ date: "2026-07-10", status: "absent" }]);

    expect(payroll.absentDeduction.toNumber()).toBe(10_000);
    expect(payroll.grossSalary.toNumber()).toBe(250_000);
    expect(payroll.cnpsEmployee.toNumber()).toBe(15_750);
    expect(payroll.itsTax.toNumber()).toBe(25_480);
    expect(payroll.totalDeductions.toNumber()).toBe(41_730);
    expect(payroll.netSalary.toNumber()).toBe(208_270);
  });
});
