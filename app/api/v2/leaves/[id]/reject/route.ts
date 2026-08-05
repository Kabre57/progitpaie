import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { RejectLeaveUseCase } from "@/lib/application/leave/use-cases/ApproveRejectLeaveUseCase";
import { leaveDecisionSchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const rejectUseCase = new RejectLeaveUseCase(repository);

// PUT /api/v2/leaves/[id]/reject - Rejeter un congé (V2 Clean Architecture)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = leaveDecisionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de décision invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await rejectUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      leaveId: id,
      comment: parseResult.data.comment,
    });

    return NextResponse.json(
      { success: true, data, message: "Demande de congé rejetée" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/v2/leaves/[id]/reject error:", error);
    const status = error.message.includes("non trouvée") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du rejet", code: "SERVER_ERROR" },
      { status }
    );
  }
}
