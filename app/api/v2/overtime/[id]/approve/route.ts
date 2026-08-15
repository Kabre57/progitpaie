import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import { ReviewOvertimeUseCase } from "@/lib/application/overtime/use-cases/ListApproveOvertimeUseCase";
import { PrismaOvertimeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaOvertimeRepository";

const reviewOvertime = new ReviewOvertimeUseCase(new PrismaOvertimeRepository());
const idSchema = z.string().trim().min(1);
const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]).default("approve"),
  justification: z.string().trim().max(1_000).optional(),
});

// PUT /api/v2/overtime/[id]/approve - Approuver / rejeter des heures supplémentaires
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsedId = idSchema.safeParse((await params).id);
    const payload: unknown = await request.json().catch(() => ({}));
    const parsedBody = reviewSchema.safeParse(payload);
    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Décision d’heures supplémentaires invalide", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await reviewOvertime.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      overtimeId: parsedId.data,
      action: parsedBody.data.action,
      justification: parsedBody.data.justification,
    });

    return NextResponse.json(
      {
        success: true,
        data,
        message: parsedBody.data.action === "reject"
          ? "Heures supplémentaires rejetées"
          : "Heures supplémentaires approuvées",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "OVERTIME_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Déclaration d'heures supplémentaires non trouvée", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === "OVERTIME_JUSTIFICATION_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          error: "Une justification d'au moins 5 caractères est obligatoire pour valider les heures supplémentaires d'un mois passé.",
          code: "JUSTIFICATION_REQUIRED",
        },
        { status: 400 }
      );
    }
    console.error("PUT /api/v2/overtime/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'approbation", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
