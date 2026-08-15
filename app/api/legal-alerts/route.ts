import { getErrorMessage } from "@/lib/error-message";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Intelligence Légale (/api/legal-alerts) ⚖️
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware-helpers";
import { LegalWatchdogService } from "@/lib/infrastructure/legal/legal-watchdog-service";

const watchdogService = new LegalWatchdogService();
const applyLegalAlertSchema = z.object({
  alertId: z.string().min(1, "L'identifiant de l'alerte (alertId) est requis"),
});

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
  } catch (error: unknown) {
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

    const parsedBody = applyLegalAlertSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.issues[0]?.message ?? "Corps de requête invalide" },
        { status: 400 }
      );
    }

    await watchdogService.applyAlertRates(parsedBody.data.alertId, authResult.userId);

    return NextResponse.json({
      success: true,
      message: "Les nouveaux taux et barèmes ont été appliqués avec succès au moteur de paie.",
    });
  } catch (error: unknown) {
    console.error("POST /api/legal-alerts/apply error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Échec d'application des taux" },
      { status: 500 }
    );
  }
}
