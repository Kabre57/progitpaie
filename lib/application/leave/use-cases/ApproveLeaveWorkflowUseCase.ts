import type {
  ApproveLeaveWorkflowInput,
  LeaveApprovalWorkflowRepository,
  LeaveApprovalWorkflowResult,
} from "../ports/LeaveApprovalWorkflowRepository";

export class ApproveLeaveWorkflowUseCase {
  public constructor(private readonly repository: LeaveApprovalWorkflowRepository) {}

  public execute(input: ApproveLeaveWorkflowInput): Promise<LeaveApprovalWorkflowResult> {
    return this.repository.approve(input);
  }
}
