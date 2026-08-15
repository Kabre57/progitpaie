import { getErrorMessage } from "@/lib/error-message";
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

// GET /api/v2/employees/[id] - Obtenir un salarié (V2 Clean Architecture)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await getByIdUseCase.execute(authResult.companyId, id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Salarié non trouvé", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// PUT /api/v2/employees/[id] - Mettre à jour un salarié (V2 Clean Architecture)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updateEmployeeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de mise à jour invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await updateUseCase.execute({
      companyId: authResult.companyId,
      id,
      ...parseResult.data,
    });

    return NextResponse.json(
      { success: true, data, message: "Fiche salarié mise à jour avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/v2/employees/[id] error:", error);
    const status = getErrorMessage(error).includes("non trouvé") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur de mise à jour", code: "SERVER_ERROR" },
      { status }
    );
  }
}

// DELETE /api/v2/employees/[id] - Désactiver un salarié (Soft Delete V2)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await deleteUseCase.execute(authResult.companyId, id);

    return NextResponse.json(
      { success: true, data, message: "Salarié désactivé avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("DELETE /api/v2/employees/[id] error:", error);
    const status = getErrorMessage(error).includes("non trouvé") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur de suppression", code: "SERVER_ERROR" },
      { status }
    );
  }
}
