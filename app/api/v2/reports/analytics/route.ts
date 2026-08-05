import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaReportRepository } from "@/lib/infrastructure/repositories/prisma/PrismaReportRepository";
import { GetHRReportAnalyticsUseCase } from "@/lib/application/report/use-cases/GetHRReportAnalyticsUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaReportRepository();
const useCase = new GetHRReportAnalyticsUseCase(repository);

// GET /api/v2/reports/analytics - Indicateurs RH & Analytics (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const data = await useCase.execute(authResult.companyId);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/reports/analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
