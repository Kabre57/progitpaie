/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Admin API Keys (/api/admin/api-keys) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiKeyService } from "@/lib/infrastructure/api-gateway/api-key-service";

const apiKeyService = new ApiKeyService();

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const keys = await apiKeyService.listApiKeys(authResult.companyId);
    return NextResponse.json({
      success: true,
      keys,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Échec de récupération des clés API" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Le nom de l'intégration est obligatoire" },
        { status: 400 }
      );
    }

    const result = await apiKeyService.createApiKey(authResult.companyId, body.name, body.permissions || ["read:all"]);

    return NextResponse.json({
      success: true,
      key: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Échec de création de la clé API" },
      { status: 500 }
    );
  }
}
