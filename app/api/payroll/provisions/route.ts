import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { validateQuery } from "@/lib/validate";
import { provisionQuerySchema } from "@/shared/validation/provision.schema";
import { GetPayrollProvisions } from "@/lib/application/payroll/provisions/GetPayrollProvisions";
import { mapProvisionResultToV2DTO } from "@/lib/application/payroll/provisions/provision.mapper";
import { mapProvisionV2ToLegacy } from "@/lib/application/payroll/provisions/legacy-provision.mapper";
import { resolveProvisionReferenceDate } from "@/lib/application/payroll/provisions/reference-date";

const SUCCESSOR_PATH = "/api/v2/payroll/provisions";

function legacyHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Deprecated", "true");
  response.headers.set("Deprecation", "true");
  response.headers.set("Link", `<${SUCCESSOR_PATH}>; rel=\"successor-version\"`);
  return response;
}

function logLegacyCall(context: {
  companyId: string;
  userId: string;
  year: number;
  status: "success" | "failure";
}): void {
  console.info("[DEPRECATED_API] GET /api/payroll/provisions", context);
}

// GET /api/payroll/provisions?year=2026
// Compatibility adapter: all financial calculations are delegated to V2.
export async function GET(request: NextRequest): Promise<Response> {
  const tenant = await requireTenant(request, "admin");
  if (tenant instanceof NextResponse) return legacyHeaders(tenant);

  const validation = validateQuery(request, provisionQuerySchema);
  if (!validation.success) return legacyHeaders(validation.response);
  const { year } = validation.data;

  try {
    const referenceDate = resolveProvisionReferenceDate({ year });
    const result = await new GetPayrollProvisions().execute({
      companyId: tenant.companyId,
      referenceDate,
    });
    const legacy = mapProvisionV2ToLegacy(mapProvisionResultToV2DTO(result), year);
    logLegacyCall({ companyId: tenant.companyId, userId: tenant.userId, year, status: "success" });

    return legacyHeaders(NextResponse.json({ success: true, data: legacy }));
  } catch (error) {
    logLegacyCall({ companyId: tenant.companyId, userId: tenant.userId, year, status: "failure" });
    if (error instanceof RangeError) {
      return legacyHeaders(NextResponse.json(
        { success: false, error: error.message, code: "INVALID_REFERENCE_DATE" },
        { status: 400 }
      ));
    }
    console.error("GET /api/payroll/provisions compatibility error:", error);
    return legacyHeaders(NextResponse.json(
      { success: false, error: "Échec du calcul des provisions congés et licenciement" },
      { status: 500 }
    ));
  }
}
