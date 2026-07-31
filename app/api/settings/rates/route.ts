import { NextResponse } from "next/server";
import { RateService } from "@/lib/rate-service";
import { DEFAULT_PAYROLL_RATES } from "@/lib/rates-config";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";

/**
 * GET /api/settings/rates
 * Récupère les taux de paie dynamiques (avec cache & fallback)
 */
export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const rateService = RateService.getInstance();
    const rates = await rateService.getRates();

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    console.error("GET /api/settings/rates error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer la configuration des taux",
        data: DEFAULT_PAYROLL_RATES,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/rates
 * Met à jour la configuration des taux (avec validation, AuditLog & invalidation du cache)
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();

    // Validation des données
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "Format JSON invalide" },
        { status: 400 }
      );
    }

    // Validation des règles métier (taux > 0, % entre 0 et 100)
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "number") {
        if (value < 0) {
          return NextResponse.json(
            { success: false, error: `La valeur pour ${key} doit être un nombre positif` },
            { status: 400 }
          );
        }
        if (key.toLowerCase().includes("rate") || key.toLowerCase().includes("ta") || key.toLowerCase().includes("fpc") || key.toLowerCase().includes("its")) {
          if (value > 100) {
            return NextResponse.json(
              { success: false, error: `Le pourcentage pour ${key} ne peut pas dépasser 100%` },
              { status: 400 }
            );
          }
        }
      }
    }

    const rateService = RateService.getInstance();
    
    // Sauvegarder les anciens taux pour l'AuditLog
    const oldRates = await rateService.getRates();
    const updatedRates = await rateService.updateRates(body);

    // Journalisation AuditLog (Double Validation — traçabilité des modifications de taux légaux)
    try {
      const admin = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });

      if (admin) {
        await prisma.auditLog.create({
          data: {
            performedById: admin.id,
            action: "UPDATE_PAYROLL_RATES",
            targetModel: "Settings",
            targetId: "payroll_rates",
            oldValues: oldRates as any,
            newValues: updatedRates as any,
            timestamp: new Date(),
          },
        });
      }
    } catch (auditError) {
      console.error("AuditLog rates update error:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Taux et barèmes mis à jour avec succès !",
      data: updatedRates,
    });
  } catch (error) {
    console.error("POST /api/settings/rates error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de la mise à jour des taux" },
      { status: 500 }
    );
  }
}
