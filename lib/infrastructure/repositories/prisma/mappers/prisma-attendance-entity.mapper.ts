import { Attendance as PrismaAttendance, AttendanceStatus as PrismaStatus } from "@prisma/client";
import { Attendance } from "@/lib/domain/attendance/entities/Attendance";
import { AttendanceStatus } from "@/lib/domain/attendance/value-objects/AttendanceStatus";
import { GeoPoint } from "@/lib/domain/attendance/value-objects/GeoPoint";
import { WorkDuration } from "@/lib/domain/attendance/value-objects/WorkDuration";

export function mapPrismaToDomainAttendance(record: PrismaAttendance): Attendance {
  const geo = record.locationLat != null && record.locationLng != null
    ? GeoPoint.create(
        record.locationLat,
        record.locationLng,
        record.accuracyMeters || undefined,
        record.distanceMeters || undefined,
        record.isWithinFence
      )
    : null;

  return new Attendance({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    date: record.date,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    status: AttendanceStatus.fromString(record.status),
    workDuration: WorkDuration.create(
      record.hoursWorked,
      record.workingMinutes,
      record.overtimeMinutes,
      record.overtimeRate
    ),
    location: geo,
    notes: record.notes,
    exceptionStatus: record.exceptionStatus,
    exceptionType: record.exceptionType,
    exceptionReason: record.exceptionReason,
    overriddenById: record.overriddenById,
    overriddenAt: record.overriddenAt,
    outOfOffice: record.outOfOffice,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
