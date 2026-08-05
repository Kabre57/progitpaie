import { prisma } from "@/lib/db";
import { EmployeeLoan } from "@/lib/domain/loan/entities/EmployeeLoan";
import { LoanRepository, ListLoansQuery } from "@/lib/application/loan/ports/LoanRepository";
import { mapPrismaToDomainLoan } from "./mappers/prisma-loan-entity.mapper";
import { LoanStatus as PrismaLoanStatus, LoanType as PrismaLoanType, Prisma } from "@prisma/client";

export class PrismaLoanRepository implements LoanRepository {
  public async list(query: ListLoansQuery): Promise<readonly EmployeeLoan[]> {
    const where: Prisma.LoanWhereInput = {
      companyId: query.companyId,
    };
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type as PrismaLoanType;
    if (query.status) where.status = query.status as PrismaLoanStatus;

    const records = await prisma.loan.findMany({
      where,
      orderBy: { startDate: "desc" },
    });

    return records.map(mapPrismaToDomainLoan);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<EmployeeLoan | null> {
    const record = await prisma.loan.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainLoan(record);
  }

  public async save(loan: EmployeeLoan): Promise<EmployeeLoan> {
    const data = {
      companyId: loan.companyId,
      userId: loan.userId,
      type: loan.type.value as PrismaLoanType,
      amount: loan.amount.toNumber(),
      monthlyDeduction: loan.monthlyDeduction.toNumber(),
      totalRepaid: loan.totalRepaid.toNumber(),
      remainingAmount: loan.remainingAmount.toNumber(),
      startDate: loan.startDate,
      status: loan.status.value as PrismaLoanStatus,
    };

    if (loan.id) {
      const updated = await prisma.loan.update({
        where: { id: loan.id, companyId: loan.companyId },
        data,
      });
      return mapPrismaToDomainLoan(updated);
    } else {
      const created = await prisma.loan.create({
        data,
      });
      return mapPrismaToDomainLoan(created);
    }
  }
}
