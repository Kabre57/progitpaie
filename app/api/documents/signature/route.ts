import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { requireTenant } from "@/lib/database/tenant-context";
import { CreateAuditLogUseCase } from "@/lib/application/audit/use-cases/CreateAuditLogUseCase";
import { PrismaAuditLogRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuditLogRepository";

const createAuditLog = new CreateAuditLogUseCase(new PrismaAuditLogRepository());
const signatureSchema = z.object({
  documentId: z.string().trim().min(1).max(120).optional(),
  signatureDataUrl: z.string().trim().min(1).max(1_000_000),
  signerName: z.string().trim().min(1).max(160),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsed = signatureSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "signatureDataUrl et signerName sont requis." },
        { status: 400 }
      );
    }

    const signatureHash = crypto.createHash("sha256").update(parsed.data.signatureDataUrl).digest("hex");
    const timestamp = new Date().toISOString();
    await createAuditLog.execute({
      companyId: authResult.companyId,
      action: "DOCUMENT_SIGNED",
      performedById: authResult.userId,
      targetModel: "Document",
      targetId: parsed.data.documentId || "DOC-GENERIC",
      oldValues: {},
      newValues: { signerName: parsed.data.signerName, signatureHash, timestamp },
      timestamp: new Date(timestamp),
    });

    return NextResponse.json({
      success: true,
      data: { signatureHash, timestamp, status: "SIGNED_VALIDATED" },
    });
  } catch (error: unknown) {
    console.error("Signature Save Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la signature." },
      { status: 500 }
    );
  }
}
