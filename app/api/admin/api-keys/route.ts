/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route Admin API Keys (/api/admin/api-keys) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiKeyService } from "@/lib/infrastructure/api-gateway/api-key-service";
import { createApiKeySchema } from "@/shared/validation/api-keys-v2.schema";

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
  } catch (error: unknown) {
    console.error("GET /api/admin/api-keys error:", error);
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

    const body = await request.json().catch(() => ({}));
    const parseResult = createApiKeySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de création de clé API invalides",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, permissions, expiresInDays } = parseResult.data;

    const result = await apiKeyService.createApiKey(
      authResult.companyId,
      name,
      permissions,
      expiresInDays
    );

    return NextResponse.json({
      success: true,
      key: result,
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/api-keys error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de création de la clé API" },
      { status: 500 }
    );
  }
}
