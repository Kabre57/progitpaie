import { Money } from "@/lib/domain/payroll/money";
import { Employee } from "../entities/Employee";
import { EmployeeId } from "../value-objects/EmployeeId";
import { Seniority } from "../value-objects/Seniority";

describe("Domaine Employee — Tests Unitaires Purs", () => {
  const companyId = "company-123";

  it("crée une entité salarié valide et calcule son brut de base", () => {
    const emp = new Employee({
      id: "emp-1",
      companyId,
      employeeId: EmployeeId.create("EMP-001"),
      name: "Theodore Kabre",
      email: "theodore@progitpaie.com",
      role: "admin",
      salary: Money.of(500000),
      sursalaire: Money.of(100000),
      transportAllowance: Money.of(30000),
      housingAllowance: Money.of(50000),
      partsIGR: 2.5,
      paymentMethod: "BANK_TRANSFER",
      joiningDate: new Date("2024-01-01"),
      isActive: true,
    });

    expect(emp.name).toBe("Theodore Kabre");
    expect(emp.email).toBe("theodore@progitpaie.com");
    expect(emp.partsIGR).toBe(2.5);
    expect(emp.calculateTotalGrossBase().equals(Money.of(680000))).toBe(true);
  });

  it("calcule l'ancienneté avec précision à partir de la date d'embauche", () => {
    const joiningDate = new Date("2024-01-01T00:00:00.000Z");
    const referenceDate = new Date("2026-07-01T00:00:00.000Z"); // 30 mois
    const seniority = Seniority.calculateFromDate(joiningDate, referenceDate);

    expect(seniority.totalMonths).toBe(30);
    expect(seniority.totalYears).toBe(2.5);
  });

  it("désactive un salarié (soft delete)", () => {
    const emp = new Employee({
      id: "emp-1",
      companyId,
      name: "Test User",
      email: "test@progitpaie.com",
      role: "employee",
      salary: Money.of(300000),
      sursalaire: Money.zero(),
      transportAllowance: Money.zero(),
      housingAllowance: Money.zero(),
      partsIGR: 1,
      paymentMethod: "CASH",
      isActive: true,
    });

    emp.deactivate();
    expect(emp.isActive).toBe(false);
  });
});
