import { AccountingRepository } from "../ports/AccountingRepository";
import { AccountingJournalDTO } from "../dto/AccountingJournalDTO";

export class GetPayrollJournalUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  public async execute(companyId: string, month: number, year: number): Promise<AccountingJournalDTO> {
    const journal = await this.repository.getPayrollJournal(companyId, month, year);

    if (journal.lines.length === 0) {
      return {
        period: journal.periodString,
        journalRows: [],
        totalDebit: 0,
        totalCredit: 0,
        isBalanced: true,
        message: "Aucune fiche de paie générée pour ce mois.",
      };
    }

    return {
      period: journal.periodString,
      journalRows: journal.lines.map((l) => ({
        date: l.date,
        piece: l.piece,
        accountNumber: l.account.number,
        accountName: l.account.name,
        debit: l.debit.toNumber(),
        credit: l.credit.toNumber(),
      })),
      totalDebit: journal.totalDebit.toNumber(),
      totalCredit: journal.totalCredit.toNumber(),
      isBalanced: journal.isBalanced(),
    };
  }
}
