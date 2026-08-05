/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Analytics (/api/analytics/summary) 📊
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { AnalyticsService } from "@/lib/infrastructure/analytics/analytics-service";

const analyticsService = new AnalyticsService();

// GET /api/analytics/summary?month=7&year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    // companyId extrait du contexte authentifié — jamais des query params
    const summary = await analyticsService.getSummary(authResult.companyId, month, year);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("GET /api/analytics/summary error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du calcul des métriques Analytics" },
      { status: 500 }
    );
  }
}
