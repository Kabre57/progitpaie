import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaSuperAdminTeamRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSuperAdminTeamRepository";
import { ManageSuperAdminTeamUseCase } from "@/lib/application/admin/use-cases/ManageSuperAdminTeamUseCase";
import { hashPassword } from "@/lib/auth";
import { ApiResponse } from "@/types";

const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(12).optional(),
});

// PUT /api/v2/admin/team/[id] - Mettre à jour un Super Admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Paramètres invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const teamRepo = new PrismaSuperAdminTeamRepository();
    const teamUseCase = new ManageSuperAdminTeamUseCase(teamRepo, hashPassword);

    const updated = await teamUseCase.updateMember({ id, ...parsed.data });
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Super Admin ${updated.name} mis à jour avec succès`,
    });
  } catch (error: unknown) {
    console.error("PUT /api/v2/admin/team/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/admin/team/[id] - Révoquer un Super Admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "super_admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const teamRepo = new PrismaSuperAdminTeamRepository();
    const teamUseCase = new ManageSuperAdminTeamUseCase(teamRepo, hashPassword);

    await teamUseCase.revokeMember(authResult.userId, id);

    return NextResponse.json({
      success: true,
      message: "Accès Super Admin révoqué avec succès",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/v2/admin/team/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Erreur lors de la suppression";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
