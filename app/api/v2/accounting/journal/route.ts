import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAccountingRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAccountingRepository";
import { GetPayrollJournalUseCase } from "@/lib/application/accounting/use-cases/GetPayrollJournalUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaAccountingRepository();
const useCase = new GetPayrollJournalUseCase(repository);

// GET /api/v2/accounting/journal - Journal comptable (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const data = await useCase.execute(authResult.companyId, month, year);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/accounting/journal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
