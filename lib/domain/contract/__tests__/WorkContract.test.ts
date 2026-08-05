import { Money } from "@/lib/domain/payroll/money";
import { ContractType } from "../value-objects/ContractType";
import { EmployeeCategory } from "../value-objects/EmployeeCategory";
import { WorkContract } from "../entities/WorkContract";

describe("Domaine Contract — Tests Unitaires Purs", () => {
  const companyId = "company-123";
  const userId = "user-456";

  it("crée un contrat CDI valide et calcule la fin d'essai", () => {
    const startDate = new Date("2026-01-01T00:00:00.000Z");
    const contract = new WorkContract({
      companyId,
      userId,
      type: ContractType.cdi(),
      category: EmployeeCategory.cadre(),
      jobTitle: "Directeur Technique",
      startDate,
      probationPeriodMonths: 3,
      baseSalary: Money.of(1500000),
      sursalaire: Money.of(300000),
    });

    expect(contract.jobTitle).toBe("Directeur Technique");
    expect(contract.calculateTotalMonthlyCompensation().equals(Money.of(1800000))).toBe(true);

    const probationEnd = contract.calculateProbationEndDate();
    expect(probationEnd).toEqual(new Date("2026-04-01T00:00:00.000Z"));
  });

  it("impose une date de fin pour un CDD", () => {
    expect(() => {
      new WorkContract({
        companyId,
        userId,
        type: ContractType.cdd(),
        category: EmployeeCategory.employe(),
        jobTitle: "Analyste",
        startDate: new Date("2026-01-01"),
        baseSalary: Money.of(500000),
      });
    }).toThrow("Une date de fin est obligatoire pour les contrats à durée déterminée ou de stage");
  });
});
