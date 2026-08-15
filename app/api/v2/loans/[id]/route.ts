import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLoanRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLoanRepository";
import { GetLoanByIdUseCase } from "@/lib/application/loan/use-cases/ListGetLoanUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaLoanRepository();
const getByIdUseCase = new GetLoanByIdUseCase(repository);

// GET /api/v2/loans/[id] - Obtenir les détails d'un prêt (V2 Clean Architecture)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await getByIdUseCase.execute(authResult.companyId, id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Prêt non trouvé", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/loans/[id] error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
