import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireTenant } from "@/lib/database/tenant-context";
import { ExitImpersonationUseCase } from "@/lib/application/admin/use-cases/ExitImpersonationUseCase";
import { PrismaImpersonationAuditRepository } from "@/lib/infrastructure/repositories/prisma/PrismaImpersonationAuditRepository";
import { ApiResponse } from "@/types";

// POST /api/v2/admin/impersonate/exit - Quitte la session de support / impersonation
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const cookieStore = await cookies();
    const currentImpersonatedCompany = cookieStore.get("rbeas_impersonate")?.value;

    const impersonationRepo = new PrismaImpersonationAuditRepository();
    const exitUseCase = new ExitImpersonationUseCase(impersonationRepo);

    await exitUseCase.execute(authResult.userId, currentImpersonatedCompany);

    cookieStore.delete("rbeas_impersonate");

    return NextResponse.json({
      success: true,
      message: "Session de support clôturée avec succès",
    });
  } catch (error: unknown) {
    console.error("POST /api/v2/admin/impersonate/exit error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors de la sortie du mode support";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
