import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ApproveLeaveUseCase } from "@/lib/application/leave/use-cases/ApproveRejectLeaveUseCase";
import { leaveDecisionSchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const approveUseCase = new ApproveLeaveUseCase(repository);

// PUT /api/v2/leaves/[id]/approve - Approuver un congé avec workflow N1/N2
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

    const { prisma } = await import("@/lib/db");
    const leave = await prisma.leave.findFirst({
      where: { id, companyId: authResult.companyId },
    });

    if (!leave) {
      return NextResponse.json(
        { success: false, error: "Demande de congé non trouvée", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Si statut = pending_n1 ➔ Validation N1 ➔ passage à pending_n2
    if (leave.status === "pending_n1") {
      const updated = await prisma.leave.update({
        where: { id },
        data: {
          status: "pending_n2",
          approvedByN1Id: authResult.userId,
          approvedByN1At: new Date(),
          adminComment: parseResult.data.comment || leave.adminComment,
        },
      });

      return NextResponse.json(
        { success: true, data: updated, message: "Validation N1 effectuée avec succès. Transmise à la Direction RH (N2)." },
        { status: 200 }
      );
    }

    // Sinon (pending_n2 ou pending) ➔ Validation finale N2 & décompte du solde
    const data = await approveUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      leaveId: id,
      comment: parseResult.data.comment,
    });

    await prisma.leave.update({
      where: { id },
      data: {
        approvedByN2Id: authResult.userId,
        approvedByN2At: new Date(),
      },
    }).catch(() => null);

    return NextResponse.json(
      { success: true, data, message: "Demande de congé approuvée définitivement (N2)." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/v2/leaves/[id]/approve error:", error);
    const status = error.message.includes("non trouvée") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'approbation", code: "SERVER_ERROR" },
      { status }
    );
  }
}
