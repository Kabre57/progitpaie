import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaContractRepository } from "@/lib/infrastructure/repositories/prisma/PrismaContractRepository";
import { GetContractByIdUseCase } from "@/lib/application/contract/use-cases/ListGetContractUseCase";
import { DeleteContractUseCase } from "@/lib/application/contract/use-cases/DeleteContractUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaContractRepository();
const getByIdUseCase = new GetContractByIdUseCase(repository);
const deleteUseCase = new DeleteContractUseCase(repository);

// GET /api/v2/contracts/[id] - Obtenir les détails d'un contrat (V2 Clean Architecture)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const data = await getByIdUseCase.execute(authResult.companyId, id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Contrat non trouvé", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/contracts/[id] error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/contracts/[id] - Supprimer un contrat de travail (V2 Clean Architecture)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await deleteUseCase.execute(authResult.companyId, id);

    return NextResponse.json(
      { success: true, message: "Contrat supprimé avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("DELETE /api/v2/contracts/[id] error:", error);
    const status = getErrorMessage(error).includes("non trouvé") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur lors de la suppression du contrat", code: "SERVER_ERROR" },
      { status }
    );
  }
}
