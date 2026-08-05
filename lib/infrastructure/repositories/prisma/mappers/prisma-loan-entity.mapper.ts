import { Loan as PrismaLoan } from "@prisma/client";
import { EmployeeLoan } from "@/lib/domain/loan/entities/EmployeeLoan";
import { LoanType } from "@/lib/domain/loan/value-objects/LoanType";
import { LoanStatus } from "@/lib/domain/loan/value-objects/LoanStatus";
import { Money } from "@/lib/domain/payroll/money";

export function mapPrismaToDomainLoan(record: PrismaLoan): EmployeeLoan {
  return new EmployeeLoan({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    type: LoanType.fromString(record.type),
    amount: Money.of(record.amount),
    monthlyDeduction: Money.of(record.monthlyDeduction),
    totalRepaid: Money.of(record.totalRepaid),
    startDate: record.startDate,
    status: LoanStatus.fromString(record.status),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
