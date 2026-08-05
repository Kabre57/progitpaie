import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";
import { ListPayrollsUseCase } from "@/lib/application/payroll/use-cases/ListPayrolls";
import { GeneratePayrollUseCase } from "@/lib/application/payroll/use-cases/GeneratePayroll";
import { listPayrollsQuerySchema, generatePayrollSchema } from "@/shared/validation/payroll-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaPayrollRepository();
const listUseCase = new ListPayrollsUseCase(repository);
const generateUseCase = new GeneratePayrollUseCase(repository);

// GET /api/v2/payroll - Liste des bulletins de paie (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listPayrollsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de requête invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      month: parseResult.data.month,
      year: parseResult.data.year,
      status: parseResult.data.status,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/payroll error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/payroll - Génération des bulletins de paie (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = generatePayrollSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Mois et année valides requis", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const result = await generateUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      month: parseResult.data.month,
      year: parseResult.data.year,
    });

    return NextResponse.json(
      {
        success: true,
        data: { generated: result.generated, errors: result.errors.length > 0 ? result.errors : undefined },
        message: `Génération effectuée pour ${result.generated} salariés`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/payroll error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la génération", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
