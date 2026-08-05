import { prisma } from "@/lib/db";
import { OvertimeRequest } from "@/lib/domain/overtime/entities/OvertimeRequest";
import { OvertimeRepository, ListOvertimeQuery } from "@/lib/application/overtime/ports/OvertimeRepository";
import { mapPrismaToDomainOvertime } from "./mappers/prisma-overtime-entity.mapper";
import { OvertimeStatus as PrismaOvertimeStatus, Prisma } from "@prisma/client";

export class PrismaOvertimeRepository implements OvertimeRepository {
  public async list(query: ListOvertimeQuery): Promise<readonly OvertimeRequest[]> {
    const where: Prisma.OvertimeWhereInput = {
      companyId: query.companyId,
    };
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status as PrismaOvertimeStatus;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const records = await prisma.overtime.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return records.map(mapPrismaToDomainOvertime);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<OvertimeRequest | null> {
    const record = await prisma.overtime.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainOvertime(record);
  }

  public async save(overtime: OvertimeRequest): Promise<OvertimeRequest> {
    const data = {
      companyId: overtime.companyId,
      userId: overtime.userId,
      attendanceId: overtime.attendanceId || null,
      date: overtime.date,
      minutes: overtime.minutes,
      rate: overtime.rate.value,
      reason: overtime.reason,
      status: overtime.status.value as PrismaOvertimeStatus,
      approvedById: overtime.approvedById || null,
    };

    if (overtime.id) {
      const updated = await prisma.overtime.update({
        where: { id: overtime.id, companyId: overtime.companyId },
        data,
      });
      return mapPrismaToDomainOvertime(updated);
    } else {
      const created = await prisma.overtime.create({
        data,
      });
      return mapPrismaToDomainOvertime(created);
    }
  }
}
