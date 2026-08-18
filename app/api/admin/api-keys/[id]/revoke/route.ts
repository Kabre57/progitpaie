/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Admin Révocation Clé API (/api/admin/api-keys/[id]/revoke) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiKeyService } from "@/lib/infrastructure/api-gateway/api-key-service";

const apiKeyService = new ApiKeyService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const revoked = await apiKeyService.revokeApiKey(authResult.companyId, id);

    if (!revoked) {
      return NextResponse.json(
        { success: false, error: "Clé API non trouvée ou déjà révoquée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Clé API révoquée avec succès",
    });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/api-keys/[id]/revoke error:", error);
    return NextResponse.json(
      { success: false, error: "Échec lors de la révocation de la clé API" },
      { status: 500 }
    );
  }
}
