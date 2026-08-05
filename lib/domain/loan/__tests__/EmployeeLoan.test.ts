import { Money } from "@/lib/domain/payroll/money";
import { LoanType } from "../value-objects/LoanType";
import { EmployeeLoan } from "../entities/EmployeeLoan";

describe("Domaine Loan — Tests Unitaires Purs", () => {
  const companyId = "company-123";
  const userId = "user-456";

  it("crée un prêt valide et calcule le restant dû", () => {
    const loan = new EmployeeLoan({
      companyId,
      userId,
      type: LoanType.pret(),
      amount: Money.of(600000),
      monthlyDeduction: Money.of(100000),
      startDate: new Date("2026-08-01"),
    });

    expect(loan.remainingAmount.equals(Money.of(600000))).toBe(true);
    expect(loan.status.isActive()).toBe(true);
  });

  it("enregistre un remboursement mensuel et solde le prêt à terme", () => {
    const loan = new EmployeeLoan({
      companyId,
      userId,
      type: LoanType.avance(),
      amount: Money.of(200000),
      monthlyDeduction: Money.of(100000),
      startDate: new Date("2026-08-01"),
    });

    loan.repayInstallment(Money.of(100000));
    expect(loan.remainingAmount.equals(Money.of(100000))).toBe(true);
    expect(loan.status.isActive()).toBe(true);

    loan.repayInstallment(Money.of(100000));
    expect(loan.remainingAmount.equals(Money.zero())).toBe(true);
    expect(loan.status.isCompleted()).toBe(true);
  });
});
