import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaOvertimeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaOvertimeRepository";
import { ListOvertimeUseCase } from "@/lib/application/overtime/use-cases/ListApproveOvertimeUseCase";
import { CreateOvertimeUseCase } from "@/lib/application/overtime/use-cases/CreateOvertimeUseCase";
import { createOvertimeSchema, listOvertimeQuerySchema } from "@/shared/validation/overtime-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaOvertimeRepository();
const listUseCase = new ListOvertimeUseCase(repository);
const createUseCase = new CreateOvertimeUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/overtime>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/overtime - List overtime (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listOvertimeQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const overtimes = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      status: parseResult.data.status,
      startDate: parseResult.data.startDate,
      endDate: parseResult.data.endDate,
    });

    const legacyData = overtimes.map((o) => ({
      ...o,
      _id: o.id,
      userId: o.user ? { ...o.user, _id: o.user.id } : o.userId,
    }));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get overtime error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch overtime records", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}

// POST /api/overtime - Create overtime (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = createOvertimeSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid overtime data", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const overtime = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    const legacyData = {
      ...overtime,
      _id: overtime.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Overtime created successfully" }, { status: 201 })
    );
  } catch (error: any) {
    console.error("Create overtime error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to create overtime", code: "SERVER_ERROR" },
        { status: 400 }
      )
    );
  }
}
