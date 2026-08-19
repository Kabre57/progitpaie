import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaRoleRepository } from "@/lib/infrastructure/repositories/prisma/PrismaRoleRepository";
import { AssignRoleToUserUseCase } from "@/lib/application/role/use-cases/AssignRoleToUserUseCase";
import { assignRoleSchema } from "@/shared/validation/role-v2.schema";
import { ApiResponse } from "@/types";

const roleRepo = new PrismaRoleRepository();
const assignRoleUseCase = new AssignRoleToUserUseCase(roleRepo);

// POST /api/v2/roles/assign - Assigner un rôle à un utilisateur
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = assignRoleSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données d'attribution invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await assignRoleUseCase.execute(authResult.companyId, parseResult.data.userId, parseResult.data.roleId);
    return NextResponse.json({ success: true, message: "Rôle attribué avec succès" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ROLE_NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Rôle non trouvé", code: "NOT_FOUND" }, { status: 404 });
    }
    console.error("POST /api/v2/roles/assign error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'attribution du rôle", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
