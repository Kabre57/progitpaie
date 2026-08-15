import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaDeclarationRepository } from "@/lib/infrastructure/repositories/prisma/PrismaDeclarationRepository";
import { GetItsDeclarationUseCase } from "@/lib/application/declaration/use-cases/GetDeclarationUseCases";
import { ApiResponse } from "@/types";

const periodSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const repository = new PrismaDeclarationRepository();
const itsUseCase = new GetItsDeclarationUseCase(repository);

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const params = periodSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const now = new Date();
    const month = params.month ?? now.getMonth() + 1;
    const year = params.year ?? now.getFullYear();
    const data = await itsUseCase.execute(authResult.companyId, month, year);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    const isValidationError = error instanceof z.ZodError;
    console.error("GET /api/v2/declarations/its error:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      {
        success: false,
        error: isValidationError ? "Période invalide" : "Erreur serveur",
        code: isValidationError ? "INVALID_PERIOD" : "SERVER_ERROR",
      },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
