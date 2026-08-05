import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaReportRepository } from "@/lib/infrastructure/repositories/prisma/PrismaReportRepository";
import { GetHRReportAnalyticsUseCase } from "@/lib/application/report/use-cases/GetHRReportAnalyticsUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaReportRepository();
const useCase = new GetHRReportAnalyticsUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/reports/analytics>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/reports/analytics - Indicateurs RH (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const data = await useCase.execute(authResult.companyId);
    return withDeprecation(NextResponse.json({ success: true, data }, { status: 200 }));
  } catch (error: any) {
    console.error("Get HR analytics error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch HR analytics", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}
