import { Money } from "@/lib/domain/payroll/money";
import { JournalEntryLine } from "../value-objects/JournalEntryLine";

export interface PayrollJournalEntryProps {
  companyId: string;
  month: number;
  year: number;
  lines: readonly JournalEntryLine[];
}

export class PayrollJournalEntry {
  public readonly companyId: string;
  public readonly month: number;
  public readonly year: number;
  public readonly lines: readonly JournalEntryLine[];

  constructor(props: PayrollJournalEntryProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (props.month < 1 || props.month > 12) throw new Error("Mois invalide");

    this.companyId = props.companyId;
    this.month = props.month;
    this.year = props.year;
    this.lines = props.lines;
  }

  public get periodString(): string {
    return `${this.year}-${String(this.month).padStart(2, "0")}`;
  }

  public get totalDebit(): Money {
    return this.lines.reduce((sum, line) => sum.add(line.debit), Money.zero());
  }

  public get totalCredit(): Money {
    return this.lines.reduce((sum, line) => sum.add(line.credit), Money.zero());
  }

  public isBalanced(): boolean {
    return this.totalDebit.equals(this.totalCredit);
  }
}
