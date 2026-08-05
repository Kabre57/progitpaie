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

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/contracts>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/contracts - List contracts (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listContractsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const contracts = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      type: parseResult.data.type,
      status: parseResult.data.status,
    });

    const legacyData = contracts.map((c) => ({
      ...c,
      _id: c.id,
      userId: c.user ? { ...c.user, _id: c.user.id } : c.userId,
    }));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get contracts error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch contracts", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}

// POST /api/contracts - Create contract (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = createContractSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid contract data", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const contract = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    const legacyData = {
      ...contract,
      _id: contract.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Contract created successfully" }, { status: 201 })
    );
  } catch (error: any) {
    console.error("Create contract error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to create contract", code: "SERVER_ERROR" },
        { status: 400 }
      )
    );
  }
}
