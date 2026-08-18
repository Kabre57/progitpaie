/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Admin Rotation Clé API (/api/admin/api-keys/[id]/rotate) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiKeyService } from "@/lib/infrastructure/api-gateway/api-key-service";

const apiKeyService = new ApiKeyService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const newKeyResult = await apiKeyService.rotateApiKey(authResult.companyId, id);

    return NextResponse.json({
      success: true,
      message: "Rotation de clé API effectuée avec succès",
      key: newKeyResult,
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/api-keys/[id]/rotate error:", error);
    const message = error instanceof Error ? error.message : "Erreur lors de la rotation";
    const status = message.includes("non trouvée") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
