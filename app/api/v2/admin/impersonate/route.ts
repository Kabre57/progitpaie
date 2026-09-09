import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ImpersonateTenantUseCase } from "@/lib/application/admin/use-cases/ImpersonateTenantUseCase";
import { PrismaImpersonationAuditRepository } from "@/lib/infrastructure/repositories/prisma/PrismaImpersonationAuditRepository";
import { ApiResponse } from "@/types";

const impersonateSchema = z.object({
  companyId: z.string().min(1, "L'identifiant d'entreprise est obligatoire"),
});

// POST /api/v2/admin/impersonate - Démarre une session de support / impersonation pour le Super Admin
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const body: unknown = await request.json();
    const parsed = impersonateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Paramètres invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const impersonationRepo = new PrismaImpersonationAuditRepository();
    const impersonateUseCase = new ImpersonateTenantUseCase(impersonationRepo);

    const session = await impersonateUseCase.execute({
      superAdminId: authResult.userId,
      companyId: parsed.data.companyId,
    });

    const cookieStore = await cookies();
    cookieStore.set("rbeas_impersonate", parsed.data.companyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 2, // 2 heures de session support
      path: "/",
    });

    return NextResponse.json({
      success: true,
      data: session,
      message: `Mode Support activé pour l'entreprise ${session.targetCompanyName}`,
    });
  } catch (error: unknown) {
    console.error("POST /api/v2/admin/impersonate error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors du démarrage du mode support";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
