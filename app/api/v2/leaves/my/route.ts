import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ListLeavesUseCase } from "@/lib/application/leave/use-cases/ListLeavesUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const listUseCase = new ListLeavesUseCase(repository);

// GET /api/v2/leaves/my - Mes demandes de congés (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: authResult.userId,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/leaves/my error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
