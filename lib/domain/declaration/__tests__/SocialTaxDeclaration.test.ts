import { Money } from "@/lib/domain/payroll/money";
import { TaxAuthority } from "../value-objects/TaxAuthority";
import { SocialTaxDeclaration } from "../entities/SocialTaxDeclaration";

describe("Domaine Declaration — Tests Unitaires Purs", () => {
  const companyId = "company-123";

  it("crée une déclaration CNPS et calcule le total à payer", () => {
    const dec = new SocialTaxDeclaration({
      companyId,
      authority: TaxAuthority.cnps(),
      month: 8,
      year: 2026,
      totalEmployees: 10,
      totalGrossSalary: Money.of(5000000),
      totalEmployeeTax: Money.of(315000), // CNPS salarié (6.3%)
      totalEmployerContribution: Money.of(385000), // CNPS patronal (7.7%)
    });

    expect(dec.periodString).toBe("2026/08");
    expect(dec.calculateTotalAmountToPay().equals(Money.of(700000))).toBe(true);
  });
});
