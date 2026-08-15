import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { PrismaNotificationAdapter } from "@/lib/infrastructure/repositories/prisma/PrismaNotificationAdapter";
import { UpdatePayrollBonusesUseCase } from "@/lib/application/payroll/use-cases/UpdatePayrollBonuses";
import { FinalizePayrollUseCase } from "@/lib/application/payroll/use-cases/FinalizePayroll";
import { updatePayrollBonusesSchema } from "@/shared/validation/payroll-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaPayrollRepository();
const notificationAdapter = new PrismaNotificationAdapter();
const updateBonusesUseCase = new UpdatePayrollBonusesUseCase(repository);
const finalizeUseCase = new FinalizePayrollUseCase(repository, notificationAdapter);

// PUT /api/v2/payroll/[id] - Modifier les primes d'un bulletin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updatePayrollBonusesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Montant des primes invalide", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await updateBonusesUseCase.execute({
      companyId: authResult.companyId,
      payrollId: id,
      bonuses: parseResult.data.bonuses,
    });

    return NextResponse.json(
      { success: true, data, message: "Bulletin de paie mis à jour" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/v2/payroll/[id] error:", error);
    const message = error instanceof Error ? error.message : "Erreur de traitement";
    const status = message.includes("non trouvé") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur de mise à jour", code: "SERVER_ERROR" },
      { status }
    );
  }
}

// PATCH /api/v2/payroll/[id] - Finaliser un bulletin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await finalizeUseCase.execute({
      companyId: authResult.companyId,
      payrollId: id,
    });

    return NextResponse.json(
      { success: true, data, message: "Bulletin de paie finalisé avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PATCH /api/v2/payroll/[id] error:", error);
    const message = error instanceof Error ? error.message : "Erreur de traitement";
    const status = message.includes("non trouvé") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur de finalisation", code: "SERVER_ERROR" },
      { status }
    );
  }
}
