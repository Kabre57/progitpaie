import { prisma } from "@/lib/db";
import { Money } from "@/lib/domain/payroll/money";
import { AccountingAccount } from "@/lib/domain/accounting/value-objects/AccountingAccount";
import { JournalEntryLine } from "@/lib/domain/accounting/value-objects/JournalEntryLine";
import { PayrollJournalEntry } from "@/lib/domain/accounting/entities/PayrollJournalEntry";
import { AccountingRepository } from "@/lib/application/accounting/ports/AccountingRepository";

export class PrismaAccountingRepository implements AccountingRepository {
  public async getPayrollJournal(companyId: string, month: number, year: number): Promise<PayrollJournalEntry> {
    const periodStr = `${year}-${String(month).padStart(2, "0")}`;
    const journalDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
    const piece = `PAIE-${periodStr}`;

    const payrolls = await prisma.payroll.findMany({
      where: { month, year, companyId },
    });

    if (payrolls.length === 0) {
      return new PayrollJournalEntry({
        companyId,
        month,
        year,
        lines: [],
      });
    }

    let totalBasicSursalaire = 0;
    let totalPrimesOvertime = 0;
    let totalTransport = 0;
    let totalITS = 0;
    let totalIGR = 0;
    let totalCNPSSalarie = 0;
    let totalCNPSPatronal = 0;
    let totalFDFP = 0;
    let totalNet = 0;

    payrolls.forEach((p) => {
      totalBasicSursalaire += (p.basicSalary || 0) + (p.sursalaire || 0);
      totalPrimesOvertime += (p.bonuses || 0) + (p.overtimePay || 0);
      totalTransport += p.transportAllowance || 0;
      totalITS += p.itsTax || 0;
      totalIGR += p.igrTax || 0;
      totalCNPSSalarie += p.cnpsEmployee || 0;
      totalCNPSPatronal += p.cnpsEmployer || 0;
      totalFDFP += p.fdfpTax || 0;
      totalNet += p.netSalary || 0;
    });

    const lines: JournalEntryLine[] = [
      new JournalEntryLine(journalDate, piece, AccountingAccount.salairesBaseSursalaire(), Money.of(Math.round(totalBasicSursalaire)), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.primesHeuresSupp(), Money.of(Math.round(totalPrimesOvertime)), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.indemnitesTransport(), Money.of(Math.round(totalTransport)), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.cnpsPatronale(), Money.of(Math.round(totalCNPSPatronal)), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.fdfpPatronale(), Money.of(Math.round(totalFDFP)), Money.zero()),

      new JournalEntryLine(journalDate, piece, AccountingAccount.impotsSalaires(), Money.zero(), Money.of(Math.round(totalITS + totalIGR))),
      new JournalEntryLine(journalDate, piece, AccountingAccount.cnpsSalariePart(), Money.zero(), Money.of(Math.round(totalCNPSSalarie))),
      new JournalEntryLine(journalDate, piece, AccountingAccount.cnpsPatronalePart(), Money.zero(), Money.of(Math.round(totalCNPSPatronal))),
      new JournalEntryLine(journalDate, piece, AccountingAccount.fdfpAPayer(), Money.zero(), Money.of(Math.round(totalFDFP))),
      new JournalEntryLine(journalDate, piece, AccountingAccount.remuneraionsDuesNet(), Money.zero(), Money.of(Math.round(totalNet))),
    ];

    return new PayrollJournalEntry({
      companyId,
      month,
      year,
      lines,
    });
  }
}
