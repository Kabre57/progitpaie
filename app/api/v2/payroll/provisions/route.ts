import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { validateQuery } from "@/lib/validate";
import { provisionV2QuerySchema } from "@/shared/validation/provision.schema";
import { GetPayrollProvisions } from "@/lib/application/payroll/provisions/GetPayrollProvisions";
import { mapProvisionResultToV2DTO } from "@/lib/application/payroll/provisions/provision.mapper";
import { resolveProvisionReferenceDate } from "@/lib/application/payroll/provisions/reference-date";

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest): Promise<Response> {
  const startedAt = Date.now();
  const logRequest = (status: number): void => {
    console.info("[PROVISIONS_V2_REQUEST]", JSON.stringify({
      status,
      durationMs: Date.now() - startedAt,
    }));
  };

  const tenant = await requireTenant(request, "admin");
  if (tenant instanceof NextResponse) {
    logRequest(tenant.status);
    return noStore(tenant);
  }

  const validation = validateQuery(request, provisionV2QuerySchema);
  if (!validation.success) {
    logRequest(validation.response.status);
    return noStore(validation.response);
  }

  try {
    const referenceDate = resolveProvisionReferenceDate(validation.data);
    const result = await new GetPayrollProvisions().execute({
      companyId: tenant.companyId,
      referenceDate,
    });
    logRequest(200);
    return noStore(NextResponse.json({
      success: true,
      data: mapProvisionResultToV2DTO(result),
    }));
  } catch (error) {
    if (error instanceof RangeError) {
      logRequest(400);
      return noStore(NextResponse.json(
        { success: false, error: error.message, code: "INVALID_REFERENCE_DATE" },
        { status: 400 }
      ));
    }
    logRequest(500);
    console.error("GET /api/v2/payroll/provisions error:", error);
    return noStore(NextResponse.json(
      { success: false, error: "Impossible de calculer les provisions", code: "PROVISION_CALCULATION_ERROR" },
      { status: 500 }
    ));
  }
}
