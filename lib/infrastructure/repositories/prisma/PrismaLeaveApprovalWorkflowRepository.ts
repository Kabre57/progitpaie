import type {
  ApproveLeaveWorkflowInput,
  LeaveApprovalWorkflowRepository,
  LeaveApprovalWorkflowResult,
} from "@/lib/application/leave/ports/LeaveApprovalWorkflowRepository";
import { prisma } from "@/lib/db";

function toResult(leave: LeaveApprovalWorkflowResult): LeaveApprovalWorkflowResult {
  return leave;
}

/**
 * Adaptateur du workflow historique N1/N2. Toutes les lectures et écritures
 * sont bornées par companyId afin d’empêcher une décision inter-entreprise.
 */
export class PrismaLeaveApprovalWorkflowRepository implements LeaveApprovalWorkflowRepository {
  public async approve(input: ApproveLeaveWorkflowInput): Promise<LeaveApprovalWorkflowResult> {
    const leave = await prisma.leave.findFirst({
      where: { id: input.leaveId, companyId: input.companyId },
      select: { id: true, status: true, adminComment: true },
    });
    if (!leave) throw new Error("LEAVE_NOT_FOUND");

    const comment = input.comment?.trim() || leave.adminComment;
    if (leave.status === "pending_n1") {
      const updated = await prisma.leave.update({
        where: { id: leave.id },
        data: {
          status: "pending_n2",
          approvedByN1Id: input.adminId,
          approvedByN1At: new Date(),
          adminComment: comment,
        },
        select: {
          id: true,
          status: true,
          adminComment: true,
          approvedByN1Id: true,
          approvedByN1At: true,
          approvedByN2Id: true,
          approvedByN2At: true,
        },
      });
      return toResult(updated);
    }

    if (leave.status !== "pending" && leave.status !== "pending_n2") {
      throw new Error("LEAVE_CANNOT_APPROVE");
    }

    const updated = await prisma.leave.update({
      where: { id: leave.id },
      data: {
        status: "approved",
        approvedById: input.adminId,
        approvedByN2Id: input.adminId,
        approvedByN2At: new Date(),
        adminComment: comment,
      },
      select: {
        id: true,
        status: true,
        adminComment: true,
        approvedByN1Id: true,
        approvedByN1At: true,
        approvedByN2Id: true,
        approvedByN2At: true,
      },
    });
    return toResult(updated);
  }
}
