/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Intelligence Légale (/api/legal-alerts) ⚖️
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";
import { LegalWatchdogService } from "@/lib/infrastructure/legal/legal-watchdog-service";

const watchdogService = new LegalWatchdogService();

// GET /api/legal-alerts — Liste toutes les alertes réglementaires
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const alerts = await watchdogService.getAlerts();
    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error: any) {
    console.error("GET /api/legal-alerts error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de récupération des alertes légales" },
      { status: 500 }
    );
  }
}

// POST /api/legal-alerts/apply — Valide et applique une alerte réglementaire aux taux de paie
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = (authResult as any).user || { id: "admin" };
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: "L'identifiant de l'alerte (alertId) est requis" },
        { status: 400 }
      );
    }

    await watchdogService.applyAlertRates(alertId, user.id);

    return NextResponse.json({
      success: true,
      message: "Les nouveaux taux et barèmes ont été appliqués avec succès au moteur de paie.",
    });
  } catch (error: any) {
    console.error("POST /api/legal-alerts/apply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Échec d'application des taux" },
      { status: 500 }
    );
  }
}
