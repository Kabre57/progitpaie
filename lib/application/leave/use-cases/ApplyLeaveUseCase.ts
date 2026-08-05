import { LeaveType } from "@/lib/domain/leave/value-objects/LeaveType";
import { LeaveStatus } from "@/lib/domain/leave/value-objects/LeaveStatus";
import { LeavePeriod } from "@/lib/domain/leave/value-objects/LeavePeriod";
import { LeaveRequest } from "@/lib/domain/leave/entities/LeaveRequest";
import { LeaveRepository } from "../ports/LeaveRepository";
import { LeaveDTO } from "../dto/LeaveDTO";
import { toLeaveDTO } from "../mappers/leave-dto.mapper";

export interface ApplyLeaveCommand {
  companyId: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export class ApplyLeaveUseCase {
  constructor(private readonly repository: LeaveRepository) {}

  public async execute(command: ApplyLeaveCommand): Promise<LeaveDTO> {
    const start = new Date(command.startDate);
    const end = new Date(command.endDate);

    const period = LeavePeriod.create(start, end);
    const leaveType = LeaveType.fromString(command.leaveType);

    const leave = new LeaveRequest({
      companyId: command.companyId,
      userId: command.userId,
      leaveType,
      period,
      reason: command.reason,
      status: LeaveStatus.pending(),
    });

    const saved = await this.repository.save(leave);
    return toLeaveDTO(saved);
  }
}
