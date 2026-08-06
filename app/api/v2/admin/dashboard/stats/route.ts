import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { GetDashboardStatsUseCase } from "@/lib/application/admin/use-cases/GetDashboardStatsUseCase";

const getDashboardStatsUC = new GetDashboardStatsUseCase();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const stats = await getDashboardStatsUC.execute();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("GET /api/v2/admin/dashboard/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
