import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPermissionRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPermissionRepository";
import { GetPermissionCatalogUseCase } from "@/lib/application/role/use-cases/GetPermissionCatalogUseCase";
import { ApiResponse } from "@/types";

const permissionRepo = new PrismaPermissionRepository();
const getCatalogUseCase = new GetPermissionCatalogUseCase(permissionRepo);

// GET /api/v2/permissions - Récupère tout le catalogue de permissions (modules + permissions)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const catalog = await getCatalogUseCase.execute(authResult.companyId);
    return NextResponse.json({ success: true, data: catalog }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/permissions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du catalogue de permissions", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
