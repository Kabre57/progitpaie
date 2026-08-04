import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenant(req, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { documentId, signatureDataUrl, signerName } = await req.json();

    if (!signatureDataUrl || !signerName) {
      return NextResponse.json(
        { success: false, error: "signatureDataUrl et signerName sont requis." },
        { status: 400 }
      );
    }

    // Calcul de l'empreinte SHA-256 de la signature
    const hash = crypto.createHash("sha256").update(signatureDataUrl).digest("hex");
    const timestamp = new Date().toISOString();

    // Journal d'audit d'authentification juridique de la signature
    await prisma.auditLog.create({
      data: {
        companyId: authResult.companyId,
        action: "DOCUMENT_SIGNED",
        performedById: authResult.userId,
        targetModel: "Document",
        targetId: documentId || "DOC-GENERIC",
        newValues: {
          signerName,
          signatureHash: hash,
          timestamp,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        signatureHash: hash,
        timestamp,
        status: "SIGNED_VALIDATED",
      },
    });
  } catch (error: any) {
    console.error("Signature Save Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'enregistrement de la signature." },
      { status: 500 }
    );
  }
}
