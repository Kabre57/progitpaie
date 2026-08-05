import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ApplyLeaveUseCase } from "@/lib/application/leave/use-cases/ApplyLeaveUseCase";
import { applyLeaveSchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const applyUseCase = new ApplyLeaveUseCase(repository);

// POST /api/v2/leaves/apply - Soumettre une demande de congé (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = applyLeaveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de demande de congé invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await applyUseCase.execute({
      companyId: authResult.companyId,
      userId: authResult.userId,
      ...parseResult.data,
    });

    return NextResponse.json(
      { success: true, data, message: "Demande de congé enregistrée avec succès" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/leaves/apply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de soumission de congé", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
