import { Contract as PrismaContract } from "@prisma/client";
import { WorkContract } from "@/lib/domain/contract/entities/WorkContract";
import { ContractType } from "@/lib/domain/contract/value-objects/ContractType";
import { EmployeeCategory } from "@/lib/domain/contract/value-objects/EmployeeCategory";
import { Money } from "@/lib/domain/payroll/money";

export function mapPrismaToDomainContract(record: PrismaContract): WorkContract {
  return new WorkContract({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    type: ContractType.fromString(record.type),
    category: EmployeeCategory.fromString(record.category),
    jobTitle: record.jobTitle,
    startDate: record.startDate,
    endDate: record.endDate,
    probationPeriodMonths: record.probationPeriodMonths,
    baseSalary: Money.of(record.baseSalary),
    sursalaire: Money.of(record.sursalaire),
    transportAllowance: Money.of(record.transportAllowance),
    housingAllowance: Money.of(record.housingAllowance),
    documentUrl: record.documentUrl,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
