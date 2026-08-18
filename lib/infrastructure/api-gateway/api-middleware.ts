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
  permissions: string[];
}

/**
 * Authentifie une requête API publique via X-API-Key ou Authorization Bearer.
 * Transmet le tenant, l'identifiant de la clé et les permissions associées.
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

  // Injecter le companyId, apiKeyId et permissions dans les headers internes
  request.headers.set("x-api-company-id", result.companyId);
  request.headers.set("x-api-key-id", result.id);
  request.headers.set("x-api-permissions", JSON.stringify(result.permissions));

  return null; // Authentification réussie
}

/**
 * Extrait le contexte API Publique (companyId, apiKeyId, permissions) depuis les headers internes.
 */
export function getPublicApiContext(request: NextRequest): PublicApiContext | null {
  const companyId = request.headers.get("x-api-company-id");
  const apiKeyId = request.headers.get("x-api-key-id");
  const permissionsStr = request.headers.get("x-api-permissions");

  if (!companyId || !apiKeyId) return null;

  let permissions: string[] = [];
  if (permissionsStr) {
    try {
      permissions = JSON.parse(permissionsStr);
    } catch {
      permissions = [];
    }
  }

  return { companyId, apiKeyId, permissions };
}

/**
 * Garde de sécurité pour valider qu'une clé API dispose du scope requis.
 * Exemple: requireApiScope(request, "read:payroll")
 */
export function requireApiScope(request: NextRequest, requiredScope: string): NextResponse | null {
  const context = getPublicApiContext(request);
  if (!context) {
    return NextResponse.json(
      { success: false, error: "Contexte d'authentification API manquant" },
      { status: 401 }
    );
  }

  const { permissions } = context;
  const hasAccess = permissions.includes("read:all") || permissions.includes(requiredScope);

  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: `Permission insuffisante. La permission '${requiredScope}' est requise pour cet endpoint.`,
        requiredScope,
      },
      { status: 403 }
    );
  }

  return null; // Accès autorisé
}
