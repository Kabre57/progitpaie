import { Attendance } from "@/lib/domain/attendance/entities/Attendance";
import { AttendanceDTO } from "../dto/AttendanceDTO";

export function toAttendanceDTO(
  attendance: Attendance,
  userObj?: { id: string; name: string; email: string; employeeId?: string | null },
  overriddenByObj?: { id: string; name: string } | null
): AttendanceDTO {
  return {
    id: attendance.id || "",
    companyId: attendance.companyId,
    userId: attendance.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    date: attendance.date,
    checkIn: attendance.checkIn.toISOString(),
    checkOut: attendance.checkOut ? attendance.checkOut.toISOString() : null,
    status: attendance.status.value,
    hoursWorked: attendance.workDuration.hoursWorked,
    workingMinutes: attendance.workDuration.workingMinutes,
    overtimeMinutes: attendance.workDuration.overtimeMinutes,
    overtimeRate: attendance.workDuration.overtimeRate,
    location: attendance.location
      ? {
          latitude: attendance.location.latitude,
          longitude: attendance.location.longitude,
          accuracyMeters: attendance.location.accuracyMeters || null,
          distanceMeters: attendance.location.distanceMeters || null,
          isWithinFence: attendance.location.isWithinFence,
        }
      : null,
    notes: attendance.notes,
    exceptionStatus: attendance.exceptionStatus,
    exceptionType: attendance.exceptionType,
    exceptionReason: attendance.exceptionReason,
    overriddenById: attendance.overriddenById,
    overriddenBy: overriddenByObj,
    overriddenAt: attendance.overriddenAt ? attendance.overriddenAt.toISOString() : null,
    outOfOffice: attendance.outOfOffice,
    createdAt: attendance.createdAt ? attendance.createdAt.toISOString() : undefined,
    updatedAt: attendance.updatedAt ? attendance.updatedAt.toISOString() : undefined,
  };
}
