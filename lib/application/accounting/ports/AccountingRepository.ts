import { PayrollJournalEntry } from "@/lib/domain/accounting/entities/PayrollJournalEntry";

export interface AccountingRepository {
  getPayrollJournal(companyId: string, month: number, year: number): Promise<PayrollJournalEntry>;
}
