export interface LeaveApprovalWorkflowResult {
  id: string;
  status: string;
  adminComment: string | null;
  approvedByN1Id: string | null;
  approvedByN1At: Date | null;
  approvedByN2Id: string | null;
  approvedByN2At: Date | null;
}

export interface ApproveLeaveWorkflowInput {
  companyId: string;
  leaveId: string;
  adminId: string;
  comment?: string;
}

export interface LeaveApprovalWorkflowRepository {
  approve(input: ApproveLeaveWorkflowInput): Promise<LeaveApprovalWorkflowResult>;
}
