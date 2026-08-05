import { Overtime as PrismaOvertime } from "@prisma/client";
import { OvertimeRequest } from "@/lib/domain/overtime/entities/OvertimeRequest";
import { OvertimeRate } from "@/lib/domain/overtime/value-objects/OvertimeRate";
import { OvertimeStatus } from "@/lib/domain/overtime/value-objects/OvertimeStatus";

export function mapPrismaToDomainOvertime(record: PrismaOvertime): OvertimeRequest {
  return new OvertimeRequest({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    attendanceId: record.attendanceId,
    date: record.date,
    minutes: record.minutes,
    rate: OvertimeRate.create(record.rate),
    reason: record.reason,
    status: OvertimeStatus.fromString(record.status),
    approvedById: record.approvedById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
