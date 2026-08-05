import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaContractRepository } from "@/lib/infrastructure/repositories/prisma/PrismaContractRepository";
import { ListContractsUseCase } from "@/lib/application/contract/use-cases/ListGetContractUseCase";
import { CreateContractUseCase } from "@/lib/application/contract/use-cases/CreateContractUseCase";
import { createContractSchema, listContractsQuerySchema } from "@/shared/validation/contract-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaContractRepository();
const listUseCase = new ListContractsUseCase(repository);
const createUseCase = new CreateContractUseCase(repository);

// GET /api/v2/contracts - Liste des contrats de travail (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listContractsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      type: parseResult.data.type,
      status: parseResult.data.status,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/contracts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/contracts - Créer un contrat de travail (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createContractSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de contrat invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    return NextResponse.json(
      { success: true, data, message: "Contrat de travail créé avec succès" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/contracts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de création de contrat", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
