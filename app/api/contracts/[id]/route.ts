import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaContractRepository } from "@/lib/infrastructure/repositories/prisma/PrismaContractRepository";
import { GetContractByIdUseCase } from "@/lib/application/contract/use-cases/ListGetContractUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaContractRepository();
const getByIdUseCase = new GetContractByIdUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/contracts/[id]>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/contracts/[id] - Get single contract (Legacy Adaptateur V1 -> V2)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const contract = await getByIdUseCase.execute(authResult.companyId, id);
    if (!contract) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Contract not found", code: "NOT_FOUND" },
          { status: 404 }
        )
      );
    }

    const legacyData = {
      ...contract,
      _id: contract.id,
    };

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get contract error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch contract", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}
