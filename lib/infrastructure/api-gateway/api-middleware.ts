/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Middleware de Sécurité API Publique ERP (/api/v2/* & /api/graphql) 🔌
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiKeyService } from "./api-key-service";
import { enforceRateLimit } from "@/lib/rate-limit";

const apiKeyService = new ApiKeyService();

export interface PublicApiContext {
  companyId: string;
  apiKeyId: string;
}

/**
 * Authentifie une requête API publique via X-API-Key ou Authorization Bearer.
 * Retourne un objet { companyId, apiKeyId } si valide, ou une NextResponse d'erreur.
 */
export async function authenticatePublicApi(
  request: NextRequest
): Promise<NextResponse | null> {
  const rateLimitResponse = await enforceRateLimit(request, "public-api", 120, 60);
  if (rateLimitResponse) return rateLimitResponse;

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

  // Validation du format avant tout accès base de données.
  // Les clés valides ont le format pk_live_<48 hex chars> (56 chars au total).
  // Une clé au format invalide est rejetée immédiatement avec 403.
  if (!rawKey.startsWith("pk_live_") || rawKey.length !== 56) {
    return NextResponse.json(
      { success: false, error: "Clé API invalide, révoquée ou expirée." },
      { status: 403 }
    );
  }

  let result: Awaited<ReturnType<typeof apiKeyService.validateApiKey>>;
  try {
    result = await apiKeyService.validateApiKey(rawKey);
  } catch {
    return NextResponse.json(
      { success: false, error: "Service d'authentification temporairement indisponible." },
      { status: 503 }
    );
  }
  if (!result) {
    return NextResponse.json(
      { success: false, error: "Clé API invalide, révoquée ou expirée." },
      { status: 403 }
    );
  }

  // Injecter le companyId dans les headers de la requête pour les routes consommatrices
  request.headers.set("x-api-company-id", result.companyId);
  request.headers.set("x-api-key-id", result.id);

  return null; // Authentification réussie
}

/**
 * Extrait le companyId résolu par authenticatePublicApi depuis les headers internes.
 * À appeler uniquement après authenticatePublicApi dans la même route.
 */
export function getPublicApiContext(request: NextRequest): PublicApiContext | null {
  const companyId = request.headers.get("x-api-company-id");
  const apiKeyId = request.headers.get("x-api-key-id");
  if (!companyId || !apiKeyId) return null;
  return { companyId, apiKeyId };
}
