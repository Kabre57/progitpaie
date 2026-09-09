import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaSystemHealthRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSystemHealthRepository";
import { GetSystemHealthUseCase } from "@/lib/application/admin/use-cases/GetSystemHealthUseCase";
import { ApiResponse } from "@/types";

// GET /api/v2/admin/system/health - Diagnostic temps réel du serveur et des services
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const healthRepo = new PrismaSystemHealthRepository();
    const getHealthUseCase = new GetSystemHealthUseCase(healthRepo);

    const health = await getHealthUseCase.execute();
    return NextResponse.json({ success: true, data: health }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/system/health error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du diagnostic système", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
