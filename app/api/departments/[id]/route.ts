import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import {
  DeactivateDepartmentUseCase,
  UpdateDepartmentUseCase,
} from "@/lib/application/hr/use-cases/DepartmentUseCases";
import type { DepartmentRecord } from "@/lib/application/hr/ports/DepartmentRepository";
import { PrismaDepartmentRepository } from "@/lib/infrastructure/repositories/prisma/PrismaDepartmentRepository";

const repository = new PrismaDepartmentRepository();
const updateDepartment = new UpdateDepartmentUseCase(repository);
const deactivateDepartment = new DeactivateDepartmentUseCase(repository);
const idSchema = z.string().trim().min(1);
const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1_000).optional(),
  managerId: z.string().trim().optional(),
}).refine((input) => Object.values(input).some((value) => value !== undefined), {
  message: "Au moins un champ doit être fourni",
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

function errorResponse(error: unknown): NextResponse<ApiResponse<unknown>> | null {
  if (error instanceof Error && error.message === "DEPARTMENT_NOT_FOUND") {
    return NextResponse.json(
      { success: false, error: "Département introuvable", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
  if (error instanceof Error && error.message === "DEPARTMENT_NAME_ALREADY_EXISTS") {
    return NextResponse.json(
      { success: false, error: "Un département avec ce nom existe déjà", code: "DUPLICATE_ERROR" },
      { status: 409 }
    );
  }
  return null;
}

// PUT /api/departments/[id] - Update department (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsedId = idSchema.safeParse((await params).id);
    const parsedInput = updateDepartmentSchema.safeParse(await request.json());
    if (!parsedId.success || !parsedInput.success) {
      return NextResponse.json(
        { success: false, error: "Données de département invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await updateDepartment.execute({
      companyId: authResult.companyId,
      id: parsedId.data,
      name: parsedInput.data.name,
      description: parsedInput.data.description,
      managerId: parsedInput.data.managerId === undefined
        ? undefined
        : parsedInput.data.managerId || null,
    });

    return NextResponse.json(
      { success: true, data: serializeDepartment(updated), message: "Département mis à jour avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const expected = errorResponse(error);
    if (expected) return expected;
    console.error("Update department error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de mettre à jour le département", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id] - Soft delete department (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsedId = idSchema.safeParse((await params).id);
    if (!parsedId.success) {
      return NextResponse.json(
        { success: false, error: "Identifiant de département invalide", code: "VALIDATION_ERROR", data: null },
        { status: 400 }
      );
    }
    await deactivateDepartment.execute(authResult.companyId, parsedId.data);
    return NextResponse.json(
      { success: true, message: "Département supprimé avec succès", data: null },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DEPARTMENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Département introuvable", code: "NOT_FOUND", data: null },
        { status: 404 }
      );
    }
    console.error("Delete department error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer le département", code: "SERVER_ERROR", data: null },
      { status: 500 }
    );
  }
}
