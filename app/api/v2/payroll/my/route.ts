import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { ListMyPayrollsUseCase } from "@/lib/application/payroll/use-cases/ListMyPayrolls";
import { listPayrollsQuerySchema } from "@/shared/validation/payroll-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaPayrollRepository();
const listMyUseCase = new ListMyPayrollsUseCase(repository);

// GET /api/v2/payroll/my - Bulletins de l'employé connecté (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listPayrollsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listMyUseCase.execute({
      companyId: authResult.companyId,
      userId: authResult.userId,
      month: parseResult.data.month,
      year: parseResult.data.year,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/payroll/my error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
