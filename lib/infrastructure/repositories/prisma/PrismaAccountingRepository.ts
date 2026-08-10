import { prisma } from "@/lib/db";
import { Money } from "@/lib/domain/payroll/money";
import { AccountingAccount } from "@/lib/domain/accounting/value-objects/AccountingAccount";
import { JournalEntryLine } from "@/lib/domain/accounting/value-objects/JournalEntryLine";
import { PayrollJournalEntry } from "@/lib/domain/accounting/entities/PayrollJournalEntry";
import { AccountingRepository } from "@/lib/application/accounting/ports/AccountingRepository";

export class PrismaAccountingRepository implements AccountingRepository {
  public async getPayrollJournal(companyId: string, month: number, year: number): Promise<PayrollJournalEntry> {
    const periodStr = `${year}-${String(month).padStart(2, "0")}`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const journalDate = `${year}-${String(month).padStart(2, "0")}-${lastDayOfMonth}`;
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
    let totalPrimesOvertimeHousing = 0;
    let totalTransport = 0;
    let totalITS = 0;
    let totalIGR = 0;
    let totalCNPSSalarie = 0;
    let totalCNPSPatronal = 0;
    let totalFDFP = 0;
    let totalNet = 0;

    payrolls.forEach((p) => {
      totalBasicSursalaire += Math.round((p.basicSalary || 0) + (p.sursalaire || 0));
      totalPrimesOvertimeHousing += Math.round((p.bonuses || 0) + (p.overtimePay || 0) + (p.housingAllowance || 0));
      totalTransport += Math.round(p.transportAllowance || 0);
      totalITS += Math.round(p.itsTax || 0);
      totalIGR += Math.round(p.igrTax || 0);
      totalCNPSSalarie += Math.round(p.cnpsEmployee || 0);
      totalCNPSPatronal += Math.round(p.cnpsEmployer || 0);
      totalFDFP += Math.round(p.fdfpTax || 0);
      totalNet += Math.round(p.netSalary || 0);
    });

    const lines: JournalEntryLine[] = [
      new JournalEntryLine(journalDate, piece, AccountingAccount.salairesBaseSursalaire(), Money.of(totalBasicSursalaire), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.primesHeuresSupp(), Money.of(totalPrimesOvertimeHousing), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.indemnitesTransport(), Money.of(totalTransport), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.cnpsPatronale(), Money.of(totalCNPSPatronal), Money.zero()),
      new JournalEntryLine(journalDate, piece, AccountingAccount.fdfpPatronale(), Money.of(totalFDFP), Money.zero()),

      new JournalEntryLine(journalDate, piece, AccountingAccount.impotsSalaires(), Money.zero(), Money.of(totalITS + totalIGR)),
      new JournalEntryLine(journalDate, piece, AccountingAccount.cnpsSalariePart(), Money.zero(), Money.of(totalCNPSSalarie)),
      new JournalEntryLine(journalDate, piece, AccountingAccount.cnpsPatronalePart(), Money.zero(), Money.of(totalCNPSPatronal)),
      new JournalEntryLine(journalDate, piece, AccountingAccount.fdfpAPayer(), Money.zero(), Money.of(totalFDFP)),
      new JournalEntryLine(journalDate, piece, AccountingAccount.remuneraionsDuesNet(), Money.zero(), Money.of(totalNet)),
    ];

    return new PayrollJournalEntry({
      companyId,
      month,
      year,
      lines,
    });
  }
}
