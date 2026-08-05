import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaOvertimeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaOvertimeRepository";
import { ApproveOvertimeUseCase } from "@/lib/application/overtime/use-cases/ListApproveOvertimeUseCase";
import { ApiResponse } from "@/types";

const repository = new PrismaOvertimeRepository();
const approveUseCase = new ApproveOvertimeUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/overtime/[id]/approve>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// PUT /api/overtime/[id]/approve - Approve overtime (Legacy Adaptateur V1 -> V2)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const updated = await approveUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      overtimeId: id,
    });

    const legacyData = {
      ...updated,
      _id: updated.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Overtime request approved" }, { status: 200 })
    );
  } catch (error: any) {
    console.error("Approve overtime error:", error);
    const status = error.message.includes("non trouvée") ? 404 : 500;
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to approve overtime request", code: "SERVER_ERROR" },
        { status }
      )
    );
  }
}
