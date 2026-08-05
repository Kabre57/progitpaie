import { LeaveRepository } from "../ports/LeaveRepository";
import { LeaveDTO } from "../dto/LeaveDTO";
import { toLeaveDTO } from "../mappers/leave-dto.mapper";

export interface LeaveDecisionCommand {
  companyId: string;
  adminId: string;
  leaveId: string;
  comment?: string;
}

export class ApproveLeaveUseCase {
  constructor(private readonly repository: LeaveRepository) {}

  public async execute(command: LeaveDecisionCommand): Promise<LeaveDTO> {
    const leave = await this.repository.findByIdForTenant(command.companyId, command.leaveId);
    if (!leave) {
      throw new Error("Demande de congé non trouvée");
    }

    leave.approve(command.adminId, command.comment);
    const saved = await this.repository.save(leave);
    return toLeaveDTO(saved);
  }
}

export class RejectLeaveUseCase {
  constructor(private readonly repository: LeaveRepository) {}

  public async execute(command: LeaveDecisionCommand): Promise<LeaveDTO> {
    const leave = await this.repository.findByIdForTenant(command.companyId, command.leaveId);
    if (!leave) {
      throw new Error("Demande de congé non trouvée");
    }

    leave.reject(command.adminId, command.comment);
    const saved = await this.repository.save(leave);
    return toLeaveDTO(saved);
  }
}
