import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaSeveranceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaSeveranceRepository";
import { ListSeverancesUseCase } from "@/lib/application/severance/use-cases/ListSeverancesUseCase";
import { CalculateSeveranceUseCase } from "@/lib/application/severance/use-cases/CalculateSeveranceUseCase";
import { calculateSeveranceSchema, listSeverancesQuerySchema } from "@/shared/validation/severance-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaSeveranceRepository();
const listUseCase = new ListSeverancesUseCase(repository);
const calculateUseCase = new CalculateSeveranceUseCase(repository);

// GET /api/v2/severance - Liste des soldes de tout compte (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listSeverancesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      terminationType: parseResult.data.terminationType,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/severance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/severance - Calculer & enregistrer un solde de tout compte (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = calculateSeveranceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de solde de tout compte invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await calculateUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    return NextResponse.json(
      { success: true, data, message: "Solde de tout compte calculé et enregistré" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/severance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de calcul de rupture", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
