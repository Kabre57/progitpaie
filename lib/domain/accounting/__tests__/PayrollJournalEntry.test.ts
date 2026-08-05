import { Money } from "@/lib/domain/payroll/money";
import { AccountingAccount } from "../value-objects/AccountingAccount";
import { JournalEntryLine } from "../value-objects/JournalEntryLine";
import { PayrollJournalEntry } from "../entities/PayrollJournalEntry";

describe("Domaine Accounting — Tests Unitaires Purs", () => {
  const companyId = "company-123";

  it("crée un journal comptable et valide l'équilibre Débit/Crédit (Partie double)", () => {
    const lines: JournalEntryLine[] = [
      new JournalEntryLine("2026-08-31", "PAIE-2026-08", AccountingAccount.salairesBaseSursalaire(), Money.of(1000000), Money.zero()),
      new JournalEntryLine("2026-08-31", "PAIE-2026-08", AccountingAccount.cnpsSalariePart(), Money.zero(), Money.of(63000)),
      new JournalEntryLine("2026-08-31", "PAIE-2026-08", AccountingAccount.remuneraionsDuesNet(), Money.zero(), Money.of(937000)),
    ];

    const journal = new PayrollJournalEntry({
      companyId,
      month: 8,
      year: 2026,
      lines,
    });

    expect(journal.totalDebit.equals(Money.of(1000000))).toBe(true);
    expect(journal.totalCredit.equals(Money.of(1000000))).toBe(true);
    expect(journal.isBalanced()).toBe(true);
  });
});
