import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { leaveDecisionSchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";
import { ApproveLeaveWorkflowUseCase } from "@/lib/application/leave/use-cases/ApproveLeaveWorkflowUseCase";
import { PrismaLeaveApprovalWorkflowRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveApprovalWorkflowRepository";

const approveLeave = new ApproveLeaveWorkflowUseCase(new PrismaLeaveApprovalWorkflowRepository());
const idSchema = z.string().trim().min(1);

// PUT /api/v2/leaves/[id]/approve - Approuver un congé avec workflow N1/N2
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsedId = idSchema.safeParse((await params).id);
    const payload: unknown = await request.json().catch(() => ({}));
    const parsedBody = leaveDecisionSchema.safeParse(payload);
    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Données de décision invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const result = await approveLeave.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      leaveId: parsedId.data,
      comment: parsedBody.data.comment,
    });
    const isN1 = result.status === "pending_n2";

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: isN1
          ? "Validation N1 effectuée avec succès. Transmise à la Direction RH (N2)."
          : "Demande de congé approuvée définitivement (N2).",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "LEAVE_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Demande de congé non trouvée", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === "LEAVE_CANNOT_APPROVE") {
      return NextResponse.json(
        { success: false, error: "Cette demande de congé ne peut plus être approuvée", code: "INVALID_STATE" },
        { status: 400 }
      );
    }
    console.error("PUT /api/v2/leaves/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'approbation", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
