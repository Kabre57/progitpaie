import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaOvertimeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaOvertimeRepository";
import { ListOvertimeUseCase, ApproveOvertimeUseCase } from "@/lib/application/overtime/use-cases/ListApproveOvertimeUseCase";
import { CreateOvertimeUseCase } from "@/lib/application/overtime/use-cases/CreateOvertimeUseCase";
import { createOvertimeSchema, listOvertimeQuerySchema } from "@/shared/validation/overtime-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaOvertimeRepository();
const listUseCase = new ListOvertimeUseCase(repository);
const createUseCase = new CreateOvertimeUseCase(repository);

// GET /api/v2/overtime - Liste des déclarations d'heures supp. (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listOvertimeQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      status: parseResult.data.status,
      startDate: parseResult.data.startDate,
      endDate: parseResult.data.endDate,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/overtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/overtime - Déclarer des heures supp. (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createOvertimeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données d'heures supplémentaires invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    return NextResponse.json(
      { success: true, data, message: "Heures supplémentaires déclarées" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/overtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de déclaration", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
