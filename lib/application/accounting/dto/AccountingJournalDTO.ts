export interface JournalRowDTO {
  date: string;
  piece: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface AccountingJournalDTO {
  period: string;
  journalRows: JournalRowDTO[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  message?: string;
}
