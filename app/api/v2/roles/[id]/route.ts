import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaRoleRepository } from "@/lib/infrastructure/repositories/prisma/PrismaRoleRepository";
import { UpdateRoleUseCase } from "@/lib/application/role/use-cases/UpdateRoleUseCase";
import { DeleteRoleUseCase } from "@/lib/application/role/use-cases/DeleteRoleUseCase";
import { updateRoleSchema } from "@/shared/validation/role-v2.schema";
import { ApiResponse } from "@/types";

const roleRepo = new PrismaRoleRepository();
const updateRoleUseCase = new UpdateRoleUseCase(roleRepo);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepo);

// GET /api/v2/roles/[id] - Détail d'un rôle
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    const role = await roleRepo.findById(authResult.companyId, id);
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Rôle non trouvé", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/roles/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// PUT /api/v2/roles/[id] - Mettre à jour un rôle et ses permissions
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updateRoleSchema.safeParse(body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: `Données invalides: ${issueMsg}`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await updateRoleUseCase.execute(authResult.companyId, id, parseResult.data);
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "ROLE_NOT_FOUND") {
        return NextResponse.json({ success: false, error: "Rôle non trouvé", code: "NOT_FOUND" }, { status: 404 });
      }
      if (error.message === "ROLE_NAME_ALREADY_EXISTS") {
        return NextResponse.json({ success: false, error: "Un rôle avec ce nom existe déjà", code: "ROLE_EXISTS" }, { status: 409 });
      }
    }
    console.error("PUT /api/v2/roles/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du rôle", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/roles/[id] - Supprimer un rôle
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    await deleteRoleUseCase.execute(authResult.companyId, id);

    return NextResponse.json({ success: true, message: "Rôle supprimé avec succès" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "ROLE_NOT_FOUND") {
        return NextResponse.json({ success: false, error: "Rôle non trouvé", code: "NOT_FOUND" }, { status: 404 });
      }
      if (error.message === "CANNOT_DELETE_SYSTEM_ROLE") {
        return NextResponse.json({ success: false, error: "Impossible de supprimer un rôle système", code: "FORBIDDEN" }, { status: 403 });
      }
      if (error.message === "CANNOT_DELETE_ROLE_WITH_ASSIGNED_USERS") {
        return NextResponse.json(
          { success: false, error: "Impossible de supprimer ce rôle car des utilisateurs y sont encore rattachés", code: "ROLE_IN_USE" },
          { status: 400 }
        );
      }
    }
    console.error("DELETE /api/v2/roles/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du rôle", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
