import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ListLeavesUseCase } from "@/lib/application/leave/use-cases/ListLeavesUseCase";
import { listLeavesQuerySchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const listUseCase = new ListLeavesUseCase(repository);

// GET /api/v2/leaves - Liste des demandes de congés (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listLeavesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      status: parseResult.data.status,
      leaveType: parseResult.data.leaveType,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/leaves error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
