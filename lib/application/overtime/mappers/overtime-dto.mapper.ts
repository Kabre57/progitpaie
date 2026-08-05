import { OvertimeRequest } from "@/lib/domain/overtime/entities/OvertimeRequest";
import { OvertimeDTO } from "../dto/OvertimeDTO";

export function toOvertimeDTO(
  overtime: OvertimeRequest,
  userObj?: { id: string; name: string; email: string; employeeId?: string | null },
  approvedByObj?: { id: string; name: string } | null
): OvertimeDTO {
  return {
    id: overtime.id || "",
    companyId: overtime.companyId,
    userId: overtime.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    attendanceId: overtime.attendanceId || null,
    date: overtime.date.toISOString().split("T")[0],
    minutes: overtime.minutes,
    hours: overtime.hours,
    rate: overtime.rate.value,
    reason: overtime.reason,
    status: overtime.status.value,
    approvedById: overtime.approvedById,
    approvedBy: approvedByObj,
    createdAt: overtime.createdAt ? overtime.createdAt.toISOString() : undefined,
    updatedAt: overtime.updatedAt ? overtime.updatedAt.toISOString() : undefined,
  };
}
