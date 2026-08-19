import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPermissionRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPermissionRepository";
import { CreatePermissionModuleUseCase } from "@/lib/application/role/use-cases/CreatePermissionModuleUseCase";
import { DeletePermissionModuleUseCase } from "@/lib/application/role/use-cases/DeletePermissionModuleUseCase";
import { createPermissionModuleSchema } from "@/shared/validation/role-v2.schema";
import { ApiResponse } from "@/types";

const permissionRepo = new PrismaPermissionRepository();
const createModuleUseCase = new CreatePermissionModuleUseCase(permissionRepo);
const deleteModuleUseCase = new DeletePermissionModuleUseCase(permissionRepo);

// POST /api/v2/permissions/modules - Créer un nouveau module de permissions
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createPermissionModuleSchema.safeParse(body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: `Données de module invalides: ${issueMsg}`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const created = await createModuleUseCase.execute(authResult.companyId, parseResult.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "MODULE_CODE_ALREADY_EXISTS") {
        return NextResponse.json(
          { success: false, error: "Un module avec ce code existe déjà", code: "MODULE_EXISTS" },
          { status: 409 }
        );
      }
    }
    console.error("POST /api/v2/permissions/modules error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du module", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/permissions/modules - Supprimer un module de permissions (via query param ?id=...)
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "L'identifiant du module est requis", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await deleteModuleUseCase.execute(authResult.companyId, id);
    return NextResponse.json({ success: true, message: "Module supprimé avec succès" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "MODULE_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Module non trouvé", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.error("DELETE /api/v2/permissions/modules error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du module", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
