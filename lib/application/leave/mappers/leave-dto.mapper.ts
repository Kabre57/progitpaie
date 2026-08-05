import { LeaveRequest } from "@/lib/domain/leave/entities/LeaveRequest";
import { LeaveDTO } from "../dto/LeaveDTO";

export function toLeaveDTO(
  leave: LeaveRequest,
  userObj?: { id: string; name: string; email: string; employeeId?: string | null },
  approvedByObj?: { id: string; name: string } | null
): LeaveDTO {
  return {
    id: leave.id || "",
    companyId: leave.companyId,
    userId: leave.userId,
    user: userObj ? {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      employeeId: userObj.employeeId,
    } : undefined,
    leaveType: leave.leaveType.value,
    startDate: leave.period.startDate.toISOString().split("T")[0],
    endDate: leave.period.endDate.toISOString().split("T")[0],
    totalDays: leave.period.totalDays,
    reason: leave.reason,
    status: leave.status.value,
    approvedById: leave.approvedById,
    approvedBy: approvedByObj,
    adminComment: leave.adminComment,
    appliedAt: leave.appliedAt.toISOString(),
    createdAt: leave.createdAt ? leave.createdAt.toISOString() : undefined,
    updatedAt: leave.updatedAt ? leave.updatedAt.toISOString() : undefined,
  };
}
