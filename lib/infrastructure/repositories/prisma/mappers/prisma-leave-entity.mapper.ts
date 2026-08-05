import { Leave as PrismaLeave, LeaveStatus as PrismaLeaveStatus, LeaveType as PrismaLeaveType } from "@prisma/client";
import { LeaveRequest } from "@/lib/domain/leave/entities/LeaveRequest";
import { LeaveType } from "@/lib/domain/leave/value-objects/LeaveType";
import { LeaveStatus } from "@/lib/domain/leave/value-objects/LeaveStatus";
import { LeavePeriod } from "@/lib/domain/leave/value-objects/LeavePeriod";

export function mapPrismaToDomainLeave(record: PrismaLeave): LeaveRequest {
  const period = LeavePeriod.create(record.startDate, record.endDate, record.totalDays);
  return new LeaveRequest({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    leaveType: LeaveType.fromString(record.leaveType),
    period,
    reason: record.reason,
    status: LeaveStatus.fromString(record.status),
    approvedById: record.approvedById,
    adminComment: record.adminComment,
    appliedAt: record.appliedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
