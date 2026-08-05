import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ApplyLeaveUseCase } from "@/lib/application/leave/use-cases/ApplyLeaveUseCase";
import { applyLeaveSchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const applyUseCase = new ApplyLeaveUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/leaves/apply>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// POST /api/leaves/apply - Apply for leave (Legacy Adaptateur V1 -> V2)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const body = await request.json().catch(() => ({}));
    const parseResult = applyLeaveSchema.safeParse(body);
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid leave request data", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const leave = await applyUseCase.execute({
      companyId: authResult.companyId,
      userId: authResult.userId,
      ...parseResult.data,
    });

    const legacyData = {
      ...leave,
      _id: leave.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Leave application submitted" }, { status: 201 })
    );
  } catch (error: any) {
    console.error("Apply leave error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to submit leave application", code: "SERVER_ERROR" },
        { status: 400 }
      )
    );
  }
}
