import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types";
import { z } from "zod";

const assignManagerSchema = z.object({
  employeeId: z.string().min(1, "L'ID de l'employé est requis"),
  managerId: z.string().nullable(),
});

// PATCH /api/v2/org-chart/assign-manager - Assigner ou modifier le Supérieur Hiérarchique Direct N1
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = assignManagerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de modification invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { employeeId, managerId } = parseResult.data;

    // Prévenir les boucles circulaires (un salarié ne peut pas être son propre manager)
    if (managerId && employeeId === managerId) {
      return NextResponse.json(
        { success: false, error: "Un collaborateur ne peut pas être son propre supérieur hiérarchique.", code: "CIRCULAR_MANAGER" },
        { status: 400 }
      );
    }

    // Mettre à jour en base de données
    const updatedUser = await prisma.user.update({
      where: {
        id: employeeId,
        companyId: authResult.companyId,
      },
      data: {
        managerId: managerId || null,
      },
      select: {
        id: true,
        name: true,
        managerId: true,
        manager: { select: { name: true } },
      },
    });

    // Journal d'audit
    await prisma.auditLog.create({
      data: {
        companyId: authResult.companyId,
        performedById: authResult.userId,
        action: "ASSIGN_EMPLOYEE_MANAGER",
        targetModel: "User",
        targetId: employeeId,
        newValues: { managerId, managerName: updatedUser.manager?.name || null },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: managerId
        ? `Nouveau supérieur N1 (${updatedUser.manager?.name}) assigné avec succès.`
        : "Supérieur N1 retiré avec succès.",
    });
  } catch (error: any) {
    console.error("PATCH /api/v2/org-chart/assign-manager error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
