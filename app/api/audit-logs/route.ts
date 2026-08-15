import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import { GetAuditLogsUseCase } from "@/lib/application/admin/use-cases/GetAuditLogsUseCase";

const getAuditLogs = new GetAuditLogsUseCase();
const querySchema = z.object({
  action: z.string().trim().max(100).optional(),
  targetModel: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
});

// GET /api/audit-logs - Get all audit logs (admin only)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      action: searchParams.get("action") ?? undefined,
      targetModel: searchParams.get("targetModel") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const result = await getAuditLogs.execute({
      companyId: authResult.companyId,
      action: query.action,
      targetModel: query.targetModel,
      page: query.page,
      limit: query.limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.logs.map((log) => ({ ...log, _id: log.id })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get audit logs error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les journaux d’audit", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
