import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaSeveranceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSeveranceRepository";
import { ListSeverancesUseCase } from "@/lib/application/severance/use-cases/ListSeverancesUseCase";
import { CalculateSeveranceUseCase } from "@/lib/application/severance/use-cases/CalculateSeveranceUseCase";
import { calculateSeveranceSchema, listSeverancesQuerySchema } from "@/shared/validation/severance-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaSeveranceRepository();
const listUseCase = new ListSeverancesUseCase(repository);
const calculateUseCase = new CalculateSeveranceUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/severance>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/severance - List severance calculations (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listSeverancesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const list = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      terminationType: parseResult.data.terminationType,
    });

    const legacyData = list.map((s) => ({
      ...s,
      _id: s.id,
      userId: s.user ? { ...s.user, _id: s.user.id } : s.userId,
    }));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get severance error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch severance records", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}

// POST /api/severance - Calculate severance (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = calculateSeveranceSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid severance data", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const severance = await calculateUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    const legacyData = {
      ...severance,
      _id: severance.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Severance calculated successfully" }, { status: 201 })
    );
  } catch (error: any) {
    console.error("Calculate severance error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to calculate severance", code: "SERVER_ERROR" },
        { status: 400 }
      )
    );
  }
}
