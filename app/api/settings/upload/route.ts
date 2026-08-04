import { NextRequest, NextResponse } from "next/server";
import { PayslipConfigService } from "@/lib/payslip-config-service";
import {
  LOGO_MAX_SIZE_BYTES,
  LOGO_ALLOWED_MIME_TYPES,
  LOGO_MAGIC_NUMBERS,
} from "@/lib/payslip-config";
import { requireTenant } from "@/lib/database/tenant-context";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/settings/upload
 * Upload sécurisé de logo pour le bulletin de paie
 *
 * Règles de sécurité strictes (Réserve 2.3 — Architecte) :
 * 1. Types MIME autorisés : image/png, image/jpeg, image/webp UNIQUEMENT
 * 2. Taille maximale : 200 KB
 * 3. Validation du magic number (premiers octets du fichier)
 * 4. Conversion en Base64 pour stockage direct dans Settings JSON
 * 5. Journalisation AuditLog
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenant(req, "admin");
    if (authResult instanceof NextResponse) return authResult;
    const rateLimitResponse = await enforceRateLimit(req, "payslip-logo-upload", 10, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // 1. Validation du type MIME
    const mimeType = file.type;
    if (!LOGO_ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `Type de fichier non autorisé : ${mimeType}. Types acceptés : PNG, JPEG, WebP`,
        },
        { status: 400 }
      );
    }

    // 2. Validation de la taille
    if (file.size > LOGO_MAX_SIZE_BYTES) {
      const maxKB = Math.round(LOGO_MAX_SIZE_BYTES / 1024);
      return NextResponse.json(
        {
          success: false,
          error: `Le fichier dépasse la taille maximale de ${maxKB} KB (taille reçue : ${Math.round(file.size / 1024)} KB)`,
        },
        { status: 400 }
      );
    }

    // 3. Validation du magic number (protection contre les fichiers malveillants renommés)
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const expectedMagic = LOGO_MAGIC_NUMBERS[mimeType];
    if (expectedMagic) {
      const fileMagic = Array.from(bytes.slice(0, expectedMagic.length));
      const isValid = expectedMagic.every(
        (byte, index) => fileMagic[index] === byte
      );

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Le contenu du fichier ne correspond pas au type MIME déclaré. Fichier potentiellement malveillant.",
          },
          { status: 400 }
        );
      }
    }

    // 4. Conversion en Base64
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    // 5. Sauvegarde dans la configuration d'apparence
    const configService = PayslipConfigService.getInstance();
    await configService.updateAppearance({ logoBase64: dataUri });

    // 6. Journalisation AuditLog
    try {
      const { prisma } = await import("@/lib/db");
      const admin = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });

      if (admin) {
        await prisma.auditLog.create({
          data: {
            companyId: authResult.companyId,
            performedById: admin.id,
            action: "UPLOAD_PAYSLIP_LOGO",
            targetModel: "Settings",
            targetId: "payslip_appearance",
            newValues: {
              fileName: file.name,
              fileSize: file.size,
              mimeType: mimeType,
            },
            timestamp: new Date(),
          },
        });
      }
    } catch (auditError) {
      console.error("AuditLog upload logo error:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Logo uploadé et sauvegardé avec succès !",
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType,
      },
    });
  } catch (error) {
    console.error("POST /api/settings/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de l'upload du logo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/upload
 * Supprime le logo actuel
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireTenant(req, "admin");
    if (authResult instanceof NextResponse) return authResult;
    const configService = PayslipConfigService.getInstance();
    await configService.updateAppearance({ logoBase64: undefined });

    return NextResponse.json({
      success: true,
      message: "Logo supprimé avec succès",
    });
  } catch (error) {
    console.error("DELETE /api/settings/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de la suppression du logo" },
      { status: 500 }
    );
  }
}
