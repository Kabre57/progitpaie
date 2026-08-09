import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types";

// PUT /api/v2/overtime/[id]/approve - Approuver / Valider des heures supp avec justification obligatoire pour les mois passés
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const overtime = await prisma.overtime.findFirst({
      where: { id, companyId: authResult.companyId },
    });

    if (!overtime) {
      return NextResponse.json(
        { success: false, error: "Déclaration d'heures supplémentaires non trouvée" },
        { status: 404 }
      );
    }

    const action = body.action || "approve";
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const overtimeMonthStr = new Date(overtime.date).toISOString().slice(0, 7);

    const isPastMonth = overtimeMonthStr < currentMonthStr;

    // Justification obligatoire pour la validation d'un mois passé
    if (action === "approve" && isPastMonth) {
      const justification = String(body.justification || "").trim();
      if (justification.length < 5) {
        return NextResponse.json(
          {
            success: false,
            error: "Une justification d'au moins 5 caractères est obligatoire pour valider les heures supp d'un mois passé.",
            code: "JUSTIFICATION_REQUIRED",
          },
          { status: 400 }
        );
      }
    }

    let updatedReason = overtime.reason;
    if (body.justification && String(body.justification).trim().length >= 5) {
      updatedReason = `${overtime.reason} [Justification régularisation mois passé: ${String(body.justification).trim()}]`;
    }

    const updated = await prisma.overtime.update({
      where: { id },
      data: {
        status: action === "reject" ? "rejected" : "approved",
        approvedById: authResult.userId,
        reason: updatedReason,
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    const data = {
      id: updated.id,
      companyId: updated.companyId,
      userId: updated.userId,
      user: {
        id: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        employeeId: updated.user.employeeId || undefined,
      },
      date: updated.date.toISOString(),
      minutes: updated.minutes,
      rate: updated.rate,
      reason: updated.reason,
      status: updated.status,
      approvedById: updated.approvedById,
    };

    return NextResponse.json(
      {
        success: true,
        data,
        message: action === "reject" ? "Heures supplémentaires rejetées" : "Heures supplémentaires approuvées",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/v2/overtime/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'approbation", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
