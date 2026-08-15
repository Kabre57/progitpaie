import { prisma } from "@/lib/db";
import { WorkContract } from "@/lib/domain/contract/entities/WorkContract";
import { ContractRepository, ListContractsQuery } from "@/lib/application/contract/ports/ContractRepository";
import { mapPrismaToDomainContract } from "./mappers/prisma-contract-entity.mapper";
import { ContractType as PrismaContractType, EmployeeCategory, Prisma } from "@prisma/client";

export class PrismaContractRepository implements ContractRepository {
  public async list(query: ListContractsQuery): Promise<readonly WorkContract[]> {
    const where: Prisma.ContractWhereInput = {
      companyId: query.companyId,
    };
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type as PrismaContractType;
    if (query.status) where.status = query.status;

    const records = await prisma.contract.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, employeeId: true } } },
      orderBy: { startDate: "desc" },
    });

    return records.map(mapPrismaToDomainContract);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<WorkContract | null> {
    const record = await prisma.contract.findFirst({
      where: { id, companyId },
      include: { user: { select: { id: true, name: true, email: true, employeeId: true } } },
    });
    if (!record) return null;
    return mapPrismaToDomainContract(record);
  }

  public async save(contract: WorkContract): Promise<WorkContract> {
    const data = {
      companyId: contract.companyId,
      userId: contract.userId,
      type: contract.type.value as PrismaContractType,
      category: contract.category.value as EmployeeCategory,
      jobTitle: contract.jobTitle,
      startDate: contract.startDate,
      endDate: contract.endDate || null,
      probationPeriodMonths: contract.probationPeriodMonths,
      baseSalary: contract.baseSalary.toNumber(),
      sursalaire: contract.sursalaire.toNumber(),
      transportAllowance: contract.transportAllowance.toNumber(),
      housingAllowance: contract.housingAllowance.toNumber(),
      documentUrl: contract.documentUrl || null,
      status: contract.status,
    };

    if (contract.id) {
      const updated = await prisma.contract.update({
        where: { id: contract.id, companyId: contract.companyId },
        data,
      });
      return mapPrismaToDomainContract(updated);
    } else {
      const created = await prisma.contract.create({
        data,
      });
      return mapPrismaToDomainContract(created);
    }
  }
}
