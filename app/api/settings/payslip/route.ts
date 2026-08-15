import { NextRequest, NextResponse } from "next/server";
import { PayslipConfigService } from "@/lib/payslip-config-service";
import { requireTenant } from "@/lib/database/tenant-context";
import {
  DEFAULT_PAYSLIP_APPEARANCE,
  DEFAULT_PAYSLIP_LEGAL,
} from "@/lib/payslip-config";
import { CreateAuditLogUseCase } from "@/lib/application/audit/use-cases/CreateAuditLogUseCase";
import { PrismaAuditLogRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuditLogRepository";

const createAuditLog = new CreateAuditLogUseCase(new PrismaAuditLogRepository());

/**
 * GET /api/settings/payslip
 * Récupère la configuration complète du bulletin (apparence + mentions légales)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const configService = PayslipConfigService.getInstance();
    const [appearance, legal] = await Promise.all([
      configService.getAppearance(),
      configService.getLegal(),
    ]);

    return NextResponse.json({
      success: true,
      data: { appearance, legal },
    });
  } catch (error) {
    console.error("GET /api/settings/payslip error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer la configuration du bulletin",
        data: {
          appearance: DEFAULT_PAYSLIP_APPEARANCE,
          legal: DEFAULT_PAYSLIP_LEGAL,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/payslip
 * Met à jour la configuration du bulletin (apparence et/ou mentions légales)
 * + Journalisation AuditLog
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenant(req, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "Format JSON invalide" },
        { status: 400 }
      );
    }

    const configService = PayslipConfigService.getInstance();
    const results: Record<string, unknown> = {};

    // Mise à jour de l'apparence si fournie
    if (body.appearance && typeof body.appearance === "object") {
      const app = body.appearance;

      // Validation de la couleur hex
      if (app.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(app.primaryColor)) {
        return NextResponse.json(
          { success: false, error: "La couleur doit être au format hexadécimal (#RRGGBB)" },
          { status: 400 }
        );
      }

      // Validation de la longueur du titre
      if (app.headerTitle && app.headerTitle.length > 100) {
        return NextResponse.json(
          { success: false, error: "Le titre du bulletin ne peut pas dépasser 100 caractères" },
          { status: 400 }
        );
      }

      results.appearance = await configService.updateAppearance(app);
    }

    // Mise à jour des mentions légales si fournies
    if (body.legal && typeof body.legal === "object") {
      const legal = body.legal;

      // Validation de la longueur de la mention
      if (legal.legalNotice && legal.legalNotice.length > 500) {
        return NextResponse.json(
          { success: false, error: "La mention légale ne peut pas dépasser 500 caractères" },
          { status: 400 }
        );
      }

      results.legal = await configService.updateLegal(legal);
    }

    // Journalisation AuditLog (si un admin est identifié dans la requête)
    try {
      // L'auteur est l'administrateur authentifié, jamais une valeur client.
      if (authResult.userId) {
        await createAuditLog.execute({
          companyId: authResult.companyId,
          performedById: authResult.userId,
          action: "UPDATE_PAYSLIP_CONFIG",
          targetModel: "Settings",
          targetId: "payslip_config",
          oldValues: {},
          newValues: body,
          timestamp: new Date(),
        });
      }
    } catch (auditError) {
      // L'échec de l'audit ne doit pas bloquer la sauvegarde
      console.error("AuditLog payslip config error:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Configuration du bulletin mise à jour avec succès !",
      data: results,
    });
  } catch (error) {
    console.error("POST /api/settings/payslip error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de la mise à jour de la configuration du bulletin" },
      { status: 500 }
    );
  }
}
