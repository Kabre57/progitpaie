import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLoanRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLoanRepository";
import { ListLoansUseCase } from "@/lib/application/loan/use-cases/ListGetLoanUseCase";
import { CreateLoanUseCase } from "@/lib/application/loan/use-cases/CreateLoanUseCase";
import { createLoanSchema, listLoansQuerySchema } from "@/shared/validation/loan-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLoanRepository();
const listUseCase = new ListLoansUseCase(repository);
const createUseCase = new CreateLoanUseCase(repository);

// GET /api/v2/loans - Liste des prêts & avances (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listLoansQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      type: parseResult.data.type,
      status: parseResult.data.status,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/loans error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/loans - Accorder un prêt ou une avance (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createLoanSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de prêt invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    return NextResponse.json(
      { success: true, data, message: "Prêt / avance accordé avec succès" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/loans error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'enregistrement", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
