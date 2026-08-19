import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPermissionRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPermissionRepository";
import { CreatePermissionDefinitionUseCase } from "@/lib/application/role/use-cases/CreatePermissionDefinitionUseCase";
import { DeletePermissionDefinitionUseCase } from "@/lib/application/role/use-cases/DeletePermissionDefinitionUseCase";
import { createPermissionDefinitionSchema } from "@/shared/validation/role-v2.schema";
import { ApiResponse } from "@/types";

const permissionRepo = new PrismaPermissionRepository();
const createPermissionUseCase = new CreatePermissionDefinitionUseCase(permissionRepo);
const deletePermissionUseCase = new DeletePermissionDefinitionUseCase(permissionRepo);

// POST /api/v2/permissions/definitions - Créer une permission unitaire
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createPermissionDefinitionSchema.safeParse(body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: `Données de permission invalides: ${issueMsg}`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const created = await createPermissionUseCase.execute(authResult.companyId, parseResult.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "PERMISSION_CODE_ALREADY_EXISTS") {
        return NextResponse.json(
          { success: false, error: "Une permission avec ce code existe déjà", code: "PERMISSION_EXISTS" },
          { status: 409 }
        );
      }
      if (error.message === "MODULE_NOT_FOUND") {
        return NextResponse.json(
          { success: false, error: "Module associé non trouvé", code: "MODULE_NOT_FOUND" },
          { status: 404 }
        );
      }
    }
    console.error("POST /api/v2/permissions/definitions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la permission", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/permissions/definitions - Supprimer une permission (via query param ?id=...)
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "L'identifiant de la permission est requis", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await deletePermissionUseCase.execute(authResult.companyId, id);
    return NextResponse.json({ success: true, message: "Permission supprimée avec succès" }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/v2/permissions/definitions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de la permission", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
