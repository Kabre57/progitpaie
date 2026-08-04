import { z } from "zod";
import type { ProvisionResponse, ProvisionResponseV2 } from "@/shared/types/contracts/provision.contract";
import {
  legacyProvisionApiEnvelopeSchema,
  provisionV2ApiEnvelopeSchema,
} from "@/shared/validation/provision-response.schema";
import type { ProvisionApiVersion } from "@/lib/config/provision-api-version";

export interface PayrollProvisionQuery {
  readonly year?: number;
  readonly asOf?: string;
}

export type PayrollProvisionQueryResult =
  | { readonly apiVersion: "v2"; readonly data: ProvisionResponseV2 }
  | { readonly apiVersion: "legacy"; readonly data: ProvisionResponse };

export type ProvisionApiErrorCode =
  | "INVALID_QUERY"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "HTTP_ERROR";

export class ProvisionApiError extends Error {
  public constructor(
    message: string,
    public readonly code: ProvisionApiErrorCode,
    public readonly status?: number,
    public readonly validationIssues?: readonly z.core.$ZodIssue[]
  ) {
    super(message);
    this.name = "ProvisionApiError";
  }
}

function validateQuery(query: PayrollProvisionQuery, version: ProvisionApiVersion): void {
  if (query.year !== undefined && query.asOf !== undefined) {
    throw new ProvisionApiError("year et asOf sont mutuellement exclusifs", "INVALID_QUERY");
  }
  if (version === "legacy" && query.asOf !== undefined) {
    throw new ProvisionApiError("La date asOf n'est pas disponible en mode legacy", "INVALID_QUERY");
  }
  const currentYear = new Date().getUTCFullYear();
  if (query.year !== undefined && (!Number.isInteger(query.year) || query.year < 2000 || query.year > currentYear)) {
    throw new ProvisionApiError("L'année de référence est invalide", "INVALID_QUERY");
  }
  if (query.asOf !== undefined) {
    const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(query.asOf);
    const parsed = new Date(`${query.asOf}T00:00:00.000Z`);
    const validDate = validFormat && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === query.asOf;
    const todayIso = new Date().toISOString().slice(0, 10);
    if (!validDate || query.asOf > todayIso) {
      throw new ProvisionApiError("La date de référence est invalide", "INVALID_QUERY");
    }
  }
}

export function buildPayrollProvisionUrl(
  query: PayrollProvisionQuery,
  version: ProvisionApiVersion
): string {
  validateQuery(query, version);
  const path = version === "v2" ? "/api/v2/payroll/provisions" : "/api/payroll/provisions";
  const params = new URLSearchParams();
  if (query.year !== undefined) params.set("year", String(query.year));
  if (query.asOf !== undefined) params.set("asOf", query.asOf);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

function errorForStatus(status: number): ProvisionApiError {
  if (status === 401) return new ProvisionApiError("Votre session a expiré", "UNAUTHORIZED", status);
  if (status === 403) return new ProvisionApiError("Accès interdit", "FORBIDDEN", status);
  return new ProvisionApiError("Impossible de charger les provisions", "HTTP_ERROR", status);
}

export async function fetchPayrollProvisions(
  query: PayrollProvisionQuery,
  version: ProvisionApiVersion,
  signal?: AbortSignal
): Promise<PayrollProvisionQueryResult> {
  let response: Response;
  try {
    response = await fetch(buildPayrollProvisionUrl(query, version), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof ProvisionApiError || (error instanceof DOMException && error.name === "AbortError")) {
      throw error;
    }
    throw new ProvisionApiError("Le service est momentanément inaccessible", "NETWORK_ERROR");
  }
  if (!response.ok) throw errorForStatus(response.status);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProvisionApiError("Réponse JSON invalide", "INVALID_RESPONSE", response.status);
  }

  if (version === "v2") {
    const parsed = provisionV2ApiEnvelopeSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ProvisionApiError(
        "Les données reçues ne respectent pas le contrat attendu",
        "INVALID_RESPONSE",
        response.status,
        parsed.error.issues
      );
    }
    return { apiVersion: "v2", data: parsed.data.data };
  }

  const parsed = legacyProvisionApiEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ProvisionApiError(
      "Les données reçues ne respectent pas le contrat attendu",
      "INVALID_RESPONSE",
      response.status,
      parsed.error.issues
    );
  }
  return { apiVersion: "legacy", data: parsed.data.data };
}
