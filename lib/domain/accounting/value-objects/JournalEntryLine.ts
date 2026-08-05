import { Money } from "@/lib/domain/payroll/money";
import { AccountingAccount } from "./AccountingAccount";

export class JournalEntryLine {
  constructor(
    public readonly date: string,
    public readonly piece: string,
    public readonly account: AccountingAccount,
    public readonly debit: Money,
    public readonly credit: Money
  ) {
    if (debit.toNumber() > 0 && credit.toNumber() > 0) {
      throw new Error("Une ligne comptable ne peut pas avoir un débit et un crédit simultanément");
    }
  }
}
