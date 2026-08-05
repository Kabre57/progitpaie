import { Money } from "@/lib/domain/payroll/money";
import { OvertimeRate } from "../value-objects/OvertimeRate";
import { OvertimeStatus } from "../value-objects/OvertimeStatus";
import { OvertimeRequest } from "../entities/OvertimeRequest";

describe("Domaine Overtime — Tests Unitaires Purs", () => {
  const companyId = "company-123";
  const userId = "user-456";

  it("crée une déclaration d'heures supplémentaires valide et calcule le montant majoré", () => {
    const overtime = new OvertimeRequest({
      companyId,
      userId,
      date: new Date("2026-08-05"),
      minutes: 120, // 2 heures
      rate: OvertimeRate.standard15(), // +15%
      reason: "Clôture mensuelle",
      status: OvertimeStatus.pending(),
    });

    expect(overtime.hours).toBe(2);
    expect(overtime.status.isPending()).toBe(true);

    const hourlyRate = Money.of(2000); // 2000 FCFA / heure
    const extraPay = overtime.calculateExtraPay(hourlyRate); // 2000 * 2 * 1.15 = 4600 FCFA

    expect(extraPay.equals(Money.of(4600))).toBe(true);
  });

  it("approuve une déclaration en attente", () => {
    const overtime = new OvertimeRequest({
      companyId,
      userId,
      date: new Date("2026-08-05"),
      minutes: 60,
      rate: OvertimeRate.standard15(),
      reason: "Urgence",
      status: OvertimeStatus.pending(),
    });

    overtime.approve("admin-789");

    expect(overtime.status.isApproved()).toBe(true);
    expect(overtime.approvedById).toBe("admin-789");
  });
});
