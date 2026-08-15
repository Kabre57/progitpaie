import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import { AssignManagerUseCase } from "@/lib/application/org-chart/use-cases/AssignManagerUseCase";
import { PrismaManagerAssignmentRepository } from "@/lib/infrastructure/repositories/prisma/PrismaManagerAssignmentRepository";
import { CreateAuditLogUseCase } from "@/lib/application/audit/use-cases/CreateAuditLogUseCase";
import { PrismaAuditLogRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAuditLogRepository";

const assignManager = new AssignManagerUseCase(new PrismaManagerAssignmentRepository());
const createAuditLog = new CreateAuditLogUseCase(new PrismaAuditLogRepository());
const assignManagerSchema = z.object({
  employeeId: z.string().trim().min(1, "L'ID de l'employé est requis"),
  managerId: z.string().trim().min(1).nullable(),
});

// PATCH /api/v2/org-chart/assign-manager - Assigner ou modifier le Supérieur Hiérarchique Direct N1
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const payload: unknown = await request.json().catch(() => ({}));
    const parsed = assignManagerSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données de modification invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await assignManager.execute(
      authResult.companyId,
      parsed.data.employeeId,
      parsed.data.managerId
    );

    try {
      await createAuditLog.execute({
        companyId: authResult.companyId,
        performedById: authResult.userId,
        action: "ASSIGN_EMPLOYEE_MANAGER",
        targetModel: "User",
        targetId: updated.employeeId,
        oldValues: {},
        newValues: { managerId: updated.managerId, managerName: updated.managerName },
        timestamp: new Date(),
      });
    } catch (auditError: unknown) {
      console.error("Audit manager assignment error:", auditError);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: updated.managerId
        ? `Nouveau supérieur N1 (${updated.managerName ?? "non renseigné"}) assigné avec succès.`
        : "Supérieur N1 retiré avec succès.",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "CIRCULAR_MANAGER_ASSIGNMENT") {
      return NextResponse.json(
        { success: false, error: "Un collaborateur ne peut pas être son propre supérieur hiérarchique.", code: "CIRCULAR_MANAGER" },
        { status: 400 }
      );
    }
    if (error instanceof Error && (error.message === "EMPLOYEE_NOT_FOUND_IN_TENANT" || error.message === "MANAGER_NOT_FOUND_IN_TENANT")) {
      return NextResponse.json(
        { success: false, error: "Collaborateur ou supérieur hiérarchique introuvable dans votre entreprise.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.error("PATCH /api/v2/org-chart/assign-manager error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
