import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaLeaveRepository } from "@/lib/infrastructure/repositories/prisma/PrismaLeaveRepository";
import { ListLeavesUseCase } from "@/lib/application/leave/use-cases/ListLeavesUseCase";
import { listLeavesQuerySchema } from "@/shared/validation/leave-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaLeaveRepository();
const listUseCase = new ListLeavesUseCase(repository);

const DEPRECATION_HEADERS: Record<string, string> = {
  Deprecated: "true",
  Deprecation: "true",
  Link: '</api/v2/leaves>; rel="successor-version"',
  "Cache-Control": "private, no-store, max-age=0",
};

function withDeprecation<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(DEPRECATION_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// GET /api/leaves - List all leaves (Legacy Adaptateur V1 -> V2)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return withDeprecation(authResult);

    const { searchParams } = new URL(request.url);
    const parseResult = listLeavesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return withDeprecation(
        NextResponse.json(
          { success: false, error: "Invalid query parameters", code: "VALIDATION_ERROR" },
          { status: 400 }
        )
      );
    }

    const leaves = await listUseCase.execute({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      status: parseResult.data.status,
      leaveType: parseResult.data.leaveType,
    });

    const legacyData = leaves.map((l) => ({
      ...l,
      _id: l.id,
      userId: l.user ? { ...l.user, _id: l.user.id } : l.userId,
    }));

    return withDeprecation(NextResponse.json({ success: true, data: legacyData }, { status: 200 }));
  } catch (error: any) {
    console.error("Get leaves error:", error);
    return withDeprecation(
      NextResponse.json(
        { success: false, error: "Failed to fetch leaves", code: "SERVER_ERROR" },
        { status: 500 }
      )
    );
  }
}
