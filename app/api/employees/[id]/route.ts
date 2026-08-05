import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaEmployeeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeRepository";
import { GetEmployeeByIdUseCase } from "@/lib/application/employee/use-cases/GetEmployeeByIdUseCase";
import { UpdateEmployeeUseCase } from "@/lib/application/employee/use-cases/UpdateEmployeeUseCase";
import { SoftDeleteEmployeeUseCase } from "@/lib/application/employee/use-cases/SoftDeleteEmployeeUseCase";
import { updateEmployeeSchema } from "@/shared/validation/employee-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaEmployeeRepository();
const getByIdUseCase = new GetEmployeeByIdUseCase(repository);
const updateUseCase = new UpdateEmployeeUseCase(repository);
const deleteUseCase = new SoftDeleteEmployeeUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/employees/[id]>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/employees/[id] - Get employee details (Legacy Adaptateur V1 -> V2)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const employee = await getByIdUseCase.execute(authResult.companyId, id);
    if (!employee) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Employee not found", code: "NOT_FOUND" },
          { status: 404 }
        )
      );
    }

    const legacyData = {
      ...employee,
      _id: employee.id,
    };

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get employee error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch employee", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}

// PUT /api/employees/[id] - Update employee details (Legacy Adaptateur V1 -> V2)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updateEmployeeSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid body data", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const updated = await updateUseCase.execute({
      companyId: authResult.companyId,
      id,
      ...parseResult.data,
    });

    const legacyData = {
      ...updated,
      _id: updated.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Employee updated successfully" }, { status: 200 })
    );
  } catch (error: any) {
    console.error("Update employee error:", error);
    const status = error.message.includes("non trouvé") ? 404 : 500;
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to update employee", code: "SERVER_ERROR" },
        { status }
      )
    );
  }
}

// DELETE /api/employees/[id] - Deactivate employee (Legacy Adaptateur V1 -> V2)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const deleted = await deleteUseCase.execute(authResult.companyId, id);

    const legacyData = {
      ...deleted,
      _id: deleted.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Employee deactivated successfully" }, { status: 200 })
    );
  } catch (error: any) {
    console.error("Delete employee error:", error);
    const status = error.message.includes("non trouvé") ? 404 : 500;
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to deactivate employee", code: "SERVER_ERROR" },
        { status }
      )
    );
  }
}
