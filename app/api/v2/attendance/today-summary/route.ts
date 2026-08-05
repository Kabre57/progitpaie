import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { GetTodaySummaryUseCase } from "@/lib/application/attendance/use-cases/GetTodaySummaryUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaAttendanceRepository();
const summaryUseCase = new GetTodaySummaryUseCase(repository);

// GET /api/v2/attendance/today-summary - Résumé des présences du jour (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const data = await summaryUseCase.execute(authResult.companyId);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/attendance/today-summary error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
