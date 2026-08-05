import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLoanRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLoanRepository";
import { GetLoanByIdUseCase } from "@/lib/application/loan/use-cases/ListGetLoanUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaLoanRepository();
const getByIdUseCase = new GetLoanByIdUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/loans/[id]>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/loans/[id] - Get single loan (Legacy Adaptateur V1 -> V2)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const loan = await getByIdUseCase.execute(authResult.companyId, id);
    if (!loan) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Loan not found", code: "NOT_FOUND" },
          { status: 404 }
        )
      );
    }

    const legacyData = {
      ...loan,
      _id: loan.id,
    };

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get loan error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch loan", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}
