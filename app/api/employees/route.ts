import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";
import { ListEmployeesUseCase } from "@/lib/application/employee/use-cases/ListEmployeesUseCase";
import { CreateEmployeeUseCase } from "@/lib/application/employee/use-cases/CreateEmployeeUseCase";
import { createEmployeeSchema, listEmployeesQuerySchema } from "@/shared/validation/employee-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaEmployeeRepository();
const listUseCase = new ListEmployeesUseCase(repository);
const createUseCase = new CreateEmployeeUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/employees>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/employees - List employees (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listEmployeesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const employees = await listUseCase.execute({
      companyId: authResult.companyId,
      departmentId: parseResult.data.departmentId,
      isActive: parseResult.data.isActive !== undefined ? parseResult.data.isActive === "true" : undefined,
      search: parseResult.data.search,
    });

    const legacyData = employees.map((emp) => ({
      ...emp,
      _id: emp.id,
    }));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get employees error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch employees", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}

// POST /api/employees - Create employee (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = createEmployeeSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Name and email are required", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const employee = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    const legacyData = {
      ...employee,
      _id: employee.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Employee created successfully" }, { status: 201 })
    );
  } catch (error: any) {
    console.error("Create employee error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to create employee", code: "SERVER_ERROR" },
        { status: 400 }
      )
    );
  }
}
