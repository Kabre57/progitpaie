/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Audit IA Paie (/api/ai/audit) 🤖
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";
import { PayrollAIService } from "@/lib/infrastructure/ai/payroll-ai-service";

const aiService = new PayrollAIService();

// GET /api/ai/audit?month=7&year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    const report = await aiService.auditPayroll(month, year);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("GET /api/ai/audit error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de l'exécution de l'audit IA de paie" },
      { status: 500 }
    );
  }
}
