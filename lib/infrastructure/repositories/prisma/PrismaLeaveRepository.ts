import { prisma } from "@/lib/db";
import { LeaveRequest } from "@/lib/domain/leave/entities/LeaveRequest";
import { LeaveRepository, ListLeavesQuery } from "@/lib/application/leave/ports/LeaveRepository";
import { mapPrismaToDomainLeave } from "./mappers/prisma-leave-entity.mapper";
import { LeaveStatus as PrismaLeaveStatus, LeaveType as PrismaLeaveType, Prisma } from "@prisma/client";

export class PrismaLeaveRepository implements LeaveRepository {
  public async list(query: ListLeavesQuery): Promise<readonly LeaveRequest[]> {
    const where: Prisma.LeaveWhereInput = {
      companyId: query.companyId,
    };
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status as PrismaLeaveStatus;
    if (query.leaveType) where.leaveType = query.leaveType as PrismaLeaveType;

    const records = await prisma.leave.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return records.map(mapPrismaToDomainLeave);
  }

  public async findByIdForTenant(companyId: string, id: string): Promise<LeaveRequest | null> {
    const record = await prisma.leave.findFirst({
      where: { id, companyId },
    });
    if (!record) return null;
    return mapPrismaToDomainLeave(record);
  }

  public async save(leave: LeaveRequest): Promise<LeaveRequest> {
    const data = {
      companyId: leave.companyId,
      userId: leave.userId,
      leaveType: leave.leaveType.value as PrismaLeaveType,
      startDate: leave.period.startDate,
      endDate: leave.period.endDate,
      totalDays: leave.period.totalDays,
      reason: leave.reason,
      status: leave.status.value as PrismaLeaveStatus,
      approvedById: leave.approvedById || null,
      adminComment: leave.adminComment,
      appliedAt: leave.appliedAt,
    };

    if (leave.id) {
      const updated = await prisma.leave.update({
        where: { id: leave.id, companyId: leave.companyId },
        data,
      });
      return mapPrismaToDomainLeave(updated);
    } else {
      const created = await prisma.leave.create({
        data,
      });
      return mapPrismaToDomainLeave(created);
    }
  }
}
