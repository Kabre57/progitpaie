import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { ClearPermissionCatalogUseCase } from "@/lib/application/role/use-cases/ClearPermissionCatalogUseCase";
import { PrismaPermissionRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPermissionRepository";
import { ApiResponse } from "@/types";

const permissionRepo = new PrismaPermissionRepository();
const clearCatalogUseCase = new ClearPermissionCatalogUseCase(permissionRepo);

// POST /api/v2/permissions/clear - Vide intégralement le catalogue (0 modules, 0 permissions)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    await clearCatalogUseCase.execute(authResult.companyId);

    return NextResponse.json({
      success: true,
      message: "Catalogue de permissions vidé avec succès.",
    });
  } catch (error: unknown) {
    console.error("POST /api/v2/permissions/clear error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la réinitialisation du catalogue", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
