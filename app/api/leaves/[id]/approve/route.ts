import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ApproveLeaveUseCase } from "@/lib/application/leave/use-cases/ApproveRejectLeaveUseCase";
import { leaveDecisionSchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const approveUseCase = new ApproveLeaveUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/leaves/[id]/approve>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// PUT /api/leaves/[id]/approve - Approve leave (Legacy Adaptateur V1 -> V2)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = leaveDecisionSchema.safeParse(body);

    const updated = await approveUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      leaveId: id,
      comment: parseResult.success ? parseResult.data.comment : undefined,
    });

    const legacyData = {
      ...updated,
      _id: updated.id,
    };

    return withDeprecation(
      NextResponse.json({ success: true, data: legacyData, message: "Leave application approved" }, { status: 200 })
    );
  } catch (error: any) {
    console.error("Approve leave error:", error);
    const status = error.message.includes("non trouvée") ? 404 : 500;
    return withDeprecation(
      NextResponse.json(
        { success: false, error: error.message || "Failed to approve leave application", code: "SERVER_ERROR" },
        { status }
      )
    );
  }
}
