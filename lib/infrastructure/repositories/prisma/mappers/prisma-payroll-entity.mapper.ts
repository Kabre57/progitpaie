import { Payroll as PrismaPayroll, Prisma } from "@prisma/client";
import { Payroll } from "@/lib/domain/payroll/entities/Payroll";
import { PayrollEarning } from "@/lib/domain/payroll/entities/PayrollEarning";
import { PayrollPeriod } from "@/lib/domain/payroll/value-objects/PayrollPeriod";
import { PayrollStatus } from "@/lib/domain/payroll/value-objects/PayrollStatus";
import { Money } from "@/lib/domain/payroll/money";

export function mapPrismaToDomainPayroll(record: PrismaPayroll): Payroll {
  return new Payroll({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    period: PayrollPeriod.create(record.month, record.year),
    status: PayrollStatus.fromString(record.status),
    earnings: new PayrollEarning({
      basicSalary: Money.of(record.basicSalary),
      sursalaire: Money.of(record.sursalaire),
      transportAllowance: Money.of(record.transportAllowance),
      housingAllowance: Money.of(record.housingAllowance),
      overtimePay: Money.of(record.overtimePay),
      bonuses: Money.of(record.bonuses),
    }),
    presentDays: record.presentDays,
    absentDays: record.absentDays,
    lateDays: record.lateDays,
    leaveDays: record.leaveDays,
    unpaidLeaveDays: record.unpaidLeaveDays,
    absentDeduction: Money.of(record.absentDeduction),
    lateDeduction: Money.of(record.lateDeduction),
    unpaidLeaveDeduction: Money.of(record.unpaidLeaveDeduction),
    grossSalary: Money.of(record.grossSalary),
    itsTax: Money.of(record.itsTax),
    igrTax: Money.of(record.igrTax),
    cnpsEmployee: Money.of(record.cnpsEmployee),
    cnpsEmployer: Money.of(record.cnpsEmployer),
    fdfpTax: Money.of(record.fdfpTax),
    totalDeductions: Money.of(record.totalDeductions),
    netSalary: Money.of(record.netSalary),
    configSnapshotId: record.configSnapshotId,
    finalizedAt: record.finalizedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
