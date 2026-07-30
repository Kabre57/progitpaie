/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Middleware de Securite API Publique ERP (/api/v1/*) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiKeyService } from "./api-key-service";

const apiKeyService = new ApiKeyService();

export async function authenticatePublicApi(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get("authorization") || "";
  const apiKeyHeader = request.headers.get("x-api-key") || "";

  let rawKey = "";
  if (apiKeyHeader) {
    rawKey = apiKeyHeader;
  } else if (authHeader.startsWith("Bearer ")) {
    rawKey = authHeader.substring(7);
  }

  if (!rawKey) {
    return NextResponse.json(
      { success: false, error: "Clé API absente. Veuillez fournir l'en-tête X-API-Key ou Authorization: Bearer" },
      { status: 401 }
    );
  }

  const isValid = await apiKeyService.validateApiKey(rawKey);
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Clé API invalide, révoquée ou expirée." },
      { status: 403 }
    );
  }

  return null; // Authentification réussie
}
