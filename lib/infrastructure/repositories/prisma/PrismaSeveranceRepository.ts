import { prisma } from "@/lib/db";
import { SeveranceCalculation } from "@/lib/domain/severance/entities/SeveranceCalculation";
import { SeveranceRepository, ListSeverancesQuery } from "@/lib/application/severance/ports/SeveranceRepository";
import { mapPrismaToDomainSeverance } from "./mappers/prisma-severance-entity.mapper";
import { TerminationType as PrismaTerminationType, Prisma } from "@prisma/client";

export class PrismaSeveranceRepository implements SeveranceRepository {
  public async list(query: ListSeverancesQuery): Promise<readonly SeveranceCalculation[]> {
    const where: Prisma.SeveranceWhereInput = {
      companyId: query.companyId,
    };
    if (query.userId) where.userId = query.userId;
    if (query.terminationType) where.terminationType = query.terminationType as PrismaTerminationType;

    const records = await prisma.severance.findMany({
      where,
      orderBy: { exitDate: "desc" },
    });

    return records.map(mapPrismaToDomainSeverance);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<SeveranceCalculation | null> {
    const record = await prisma.severance.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainSeverance(record);
  }

  public async save(severance: SeveranceCalculation): Promise<SeveranceCalculation> {
    const data = {
      companyId: severance.companyId,
      userId: severance.userId,
      contractId: severance.contractId || null,
      terminationType: severance.terminationType.value as PrismaTerminationType,
      exitDate: severance.exitDate,
      seniorityYears: severance.seniorityYears,
      noticeIndemnity: severance.breakdown.noticeIndemnity.toNumber(),
      severanceIndemnity: severance.breakdown.severanceIndemnity.toNumber(),
      leaveCompensation: severance.breakdown.leaveCompensation.toNumber(),
      gratification13th: severance.breakdown.gratification13th.toNumber(),
      totalNetExit: severance.totalNetExit.toNumber(),
    };

    if (severance.id) {
      const updated = await prisma.severance.update({
        where: { id: severance.id, companyId: severance.companyId },
        data,
      });
      return mapPrismaToDomainSeverance(updated);
    } else {
      const created = await prisma.severance.create({
        data,
      });
      return mapPrismaToDomainSeverance(created);
    }
  }
}
