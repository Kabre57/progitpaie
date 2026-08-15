import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import {
  CreateDepartmentUseCase,
  ListDepartmentsUseCase,
} from "@/lib/application/hr/use-cases/DepartmentUseCases";
import type { DepartmentRecord } from "@/lib/application/hr/ports/DepartmentRepository";
import { PrismaDepartmentRepository } from "@/lib/infrastructure/repositories/prisma/PrismaDepartmentRepository";

const repository = new PrismaDepartmentRepository();
const listDepartments = new ListDepartmentsUseCase(repository);
const createDepartment = new CreateDepartmentUseCase(repository);
const createDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1_000).optional(),
  managerId: z.string().trim().min(1).nullable().optional(),
});

function serializeDepartment(department: DepartmentRecord): Record<string, unknown> {
  return {
    ...department,
    _id: department.id,
    managerId: department.manager
      ? { ...department.manager, _id: department.manager.id }
      : department.managerId,
  };
}

// GET /api/departments - Get all active departments
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
    const departments = await listDepartments.execute(authResult.companyId, includeInactive);
    return NextResponse.json(
      { success: true, data: departments.map(serializeDepartment), message: "Départements récupérés avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get departments error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les départements", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department (admin only)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsed = createDepartmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données de département invalides", details: parsed.error.issues, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const department = await createDepartment.execute({
      companyId: authResult.companyId,
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      managerId: parsed.data.managerId ?? null,
    });

    return NextResponse.json(
      { success: true, data: serializeDepartment(department), message: "Département créé avec succès" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DEPARTMENT_NAME_ALREADY_EXISTS") {
      return NextResponse.json(
        { success: false, error: "Un département avec ce nom existe déjà", code: "DUPLICATE_ERROR" },
        { status: 409 }
      );
    }
    console.error("Create department error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer le département", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
