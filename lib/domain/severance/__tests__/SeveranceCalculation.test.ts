import { Money } from "@/lib/domain/payroll/money";
import { TerminationType } from "../value-objects/TerminationType";
import { SeveranceBreakdown } from "../value-objects/SeveranceBreakdown";
import { SeveranceCalculation } from "../entities/SeveranceCalculation";

describe("Domaine Severance — Tests Unitaires Purs", () => {
  const companyId = "company-123";
  const userId = "user-456";

  it("crée un solde de tout compte et calcule le montant net global", () => {
    const breakdown = new SeveranceBreakdown(
      Money.of(500000), // Préavis
      Money.of(750000), // Licenciement
      Money.of(200000), // Congés payés
      Money.of(150000)  // 13ème mois
    );

    const severance = new SeveranceCalculation({
      companyId,
      userId,
      terminationType: TerminationType.licenciement(),
      exitDate: new Date("2026-08-31"),
      seniorityYears: 3.5,
      breakdown,
    });

    expect(severance.seniorityYears).toBe(3.5);
    expect(severance.totalNetExit.equals(Money.of(1600000))).toBe(true);
  });
});
