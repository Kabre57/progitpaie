import { Money } from "../money";
import { Payroll } from "../entities/Payroll";
import { PayrollEarning } from "../entities/PayrollEarning";
import { PayrollPeriod } from "../value-objects/PayrollPeriod";
import { PayrollStatus } from "../value-objects/PayrollStatus";
import { PayrollGenerationService } from "../services/PayrollGenerationService";

describe("Domaine Payroll — Tests Unitaires Purs", () => {
  const period = PayrollPeriod.create(1, 2026);
  const companyId = "company-123";
  const userId = "user-456";

  it("génère un bulletin brouillon valide", () => {
    const service = new PayrollGenerationService();
    const payroll = service.generateForEmployee(
      { id: userId, companyId, salary: 500000, sursalaire: 50000, transportAllowance: 30000 },
      period,
      [{ date: "2026-01-05", status: "present" }],
      0
    );

    expect(payroll.companyId).toBe(companyId);
    expect(payroll.userId).toBe(userId);
    expect(payroll.status.isDraft()).toBe(true);
    expect(payroll.netSalary.greaterThan(Money.zero())).toBe(true);
  });

  it("autorise la modification des primes en état brouillon et met à jour le salaire net", () => {
    const service = new PayrollGenerationService();
    const payroll = service.generateForEmployee(
      { id: userId, companyId, salary: 500000 },
      period,
      [],
      0
    );

    const initialNet = payroll.netSalary;
    payroll.updateBonuses(Money.of(25000));

    expect(payroll.earnings.bonuses.equals(Money.of(25000))).toBe(true);
    expect(payroll.netSalary.equals(initialNet.add(Money.of(25000)))).toBe(true);
  });

  it("interdit la modification des primes et la re-finalisation d'un bulletin finalisé", () => {
    const service = new PayrollGenerationService();
    const payroll = service.generateForEmployee(
      { id: userId, companyId, salary: 500000 },
      period,
      [],
      0
    );

    payroll.finalize(new Date());

    expect(payroll.status.isFinalized()).toBe(true);
    expect(() => payroll.updateBonuses(Money.of(10000))).toThrow(
      "Impossible de modifier un bulletin de paie déjà finalisé"
    );
    expect(() => payroll.finalize()).toThrow("Le bulletin de paie est déjà finalisé");
  });
});
