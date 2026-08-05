import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { ListPayrollsUseCase } from "@/lib/application/payroll/use-cases/ListPayrolls";
import { GeneratePayrollUseCase } from "@/lib/application/payroll/use-cases/GeneratePayroll";
import { toLegacyPayrollDTO } from "@/lib/application/payroll/mappers/payroll-dto.mapper";
import { listPayrollsQuerySchema, generatePayrollSchema } from "@/shared/validation/payroll-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaPayrollRepository();
const listUseCase = new ListPayrollsUseCase(repository);
const generateUseCase = new GeneratePayrollUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/payroll>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// POST /api/payroll - Generate payroll (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = generatePayrollSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(NextResponse.json(
        { success: false, error: "Month and year are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      ));
    }

    const result = await generateUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      month: parseResult.data.month,
      year: parseResult.data.year,
    });

    return withDeprecation(NextResponse.json(
      {
        success: true,
        data: { generated: result.generated, errors: result.errors.length > 0 ? result.errors : undefined },
        message: `Generated payroll for ${result.generated} employees`,
      },
      { status: 201 }
    ));
  } catch (error: any) {
    console.error("Generate payroll error:", error);
    return withDeprecation(NextResponse.json(
      { success: false, error: "Failed to generate payroll", code: "SERVER_ERROR" },
      { status: 500 }
    ));
  }
}

// GET /api/payroll - Get all payroll records (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listPayrollsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(NextResponse.json(
        { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
        { status: 400 }
      ));
    }

    const payrolls = await listUseCase.execute({
      companyId: authResult.companyId,
      month: parseResult.data.month,
      year: parseResult.data.year,
      status: parseResult.data.status,
    });

    const legacyData = payrolls.map((p) => toLegacyPayrollDTO(p));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get payroll error:", error);
    return withDeprecation(NextResponse.json(
      { success: false, error: "Failed to fetch payroll", code: "SERVER_ERROR" },
      { status: 500 }
    ));
  }
}
