import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Helper de Réponses API Standardisées 📡
 * Centralise le format des réponses pour toutes les routes API v2.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Génère un identifiant de corrélation unique pour le suivi des erreurs.
 * Format : timestamp-random (ex: "1724350000000-a3f8b2")
 */
function generateCorrelationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Réponse de succès standardisée.
 */
export function apiSuccess<T>(
  data: T,
  options?: { status?: number; message?: string }
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(options?.message ? { message: options.message } : {}),
    },
    { status: options?.status ?? 200 }
  );
}

/**
 * Réponse d'erreur standardisée.
 * Le message retourné au client est toujours non sensible.
 * Les détails internes sont loggés côté serveur uniquement.
 */
export function apiError(
  message: string,
  options?: {
    code?: string;
    status?: number;
    internalError?: unknown;
    context?: string;
  }
): NextResponse<ApiResponse<never>> {
  const correlationId = generateCorrelationId();
  const status = options?.status ?? 500;
  const code = options?.code ?? "SERVER_ERROR";

  // Log serveur avec détails internes (jamais envoyé au client)
  if (options?.internalError) {
    console.error(
      `[${correlationId}] ${options.context ?? "API Error"}:`,
      options.internalError instanceof Error
        ? { message: options.internalError.message, stack: options.internalError.stack }
        : options.internalError
    );
  }

  return NextResponse.json(
    {
      success: false as const,
      error: message,
      code,
      correlationId,
    },
    { status }
  );
}

/**
 * Réponse d'erreur de validation Zod standardisée.
 */
export function apiValidationError(
  issues: Array<{ path: (string | number)[]; message: string }>
): NextResponse<ApiResponse<never>> {
  const formattedIssues = issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join(", ");

  return apiError(`Données invalides: ${formattedIssues}`, {
    code: "VALIDATION_ERROR",
    status: 400,
  });
}

/**
 * Réponse 401 — Authentification requise.
 */
export function apiUnauthorized(
  message = "Authentification requise"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    code: "UNAUTHORIZED",
    status: 401,
  });
}

/**
 * Réponse 403 — Accès interdit.
 */
export function apiForbidden(
  message = "Accès interdit"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    code: "FORBIDDEN",
    status: 403,
  });
}

/**
 * Réponse 404 — Ressource non trouvée.
 */
export function apiNotFound(
  message = "Ressource non trouvée"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    code: "NOT_FOUND",
    status: 404,
  });
}
