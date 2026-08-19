import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { SeedPermissionCatalogUseCase } from "@/lib/application/role/use-cases/SeedPermissionCatalogUseCase";
import { PrismaPermissionRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPermissionRepository";
import { ApiResponse } from "@/types";

const permissionRepo = new PrismaPermissionRepository();
const seedCatalogUseCase = new SeedPermissionCatalogUseCase(permissionRepo);

// POST /api/v2/permissions/seed - Importe ou recharge le catalogue standard prédéfini (35 permissions)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const catalog = await seedCatalogUseCase.execute(authResult.companyId);

    return NextResponse.json({
      success: true,
      data: catalog,
      message: "Catalogue standard importé avec succès.",
    });
  } catch (error: unknown) {
    console.error("POST /api/v2/permissions/seed error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'importation du catalogue standard", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
