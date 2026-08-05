import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaOvertimeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaOvertimeRepository";
import { ApproveOvertimeUseCase } from "@/lib/application/overtime/use-cases/ListApproveOvertimeUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaOvertimeRepository();
const approveUseCase = new ApproveOvertimeUseCase(repository);

// PUT /api/v2/overtime/[id]/approve - Approuver des heures supp. (V2 Clean Architecture)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await approveUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      overtimeId: id,
    });

    return NextResponse.json(
      { success: true, data, message: "Heures supplémentaires approuvées" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/v2/overtime/[id]/approve error:", error);
    const status = error.message.includes("non trouvée") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Erreur d'approbation", code: "SERVER_ERROR" },
      { status }
    );
  }
}
