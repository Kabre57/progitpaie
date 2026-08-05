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

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/loans>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/loans - List loans (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listLoansQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const loans = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      type: parseResult.data.type,
      status: parseResult.data.status,
    });

    const legacyData = loans.map((l) => ({
      ...l,
      _id: l.id,
      userId: l.user ? { ...l.user, _id: l.user.id } : l.userId,
    }));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get loans error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch loans", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}

// POST /api/loans - Create loan (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = createLoanSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid loan data", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const loan = await createUseCase.execute({
      companyId: authResult.companyId,
      ...parseResult.data,
    });

    const legacyData = {
      ...loan,
      _id: loan.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Loan created successfully" }, { status: 201 })
    );
  } catch (error: any) {
    console.error("Create loan error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to create loan", code: "SERVER_ERROR" },
        { status: 400 }
      )
    );
  }
}
