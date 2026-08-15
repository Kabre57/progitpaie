import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { GetAuditLogsUseCase } from "@/lib/application/admin/use-cases/GetAuditLogsUseCase";

const auditLogsUC = new GetAuditLogsUseCase();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);

    // ─── meta query: return distinct values for filter dropdowns ──────────
    if (searchParams.get("meta") === "1") {
      const meta = await auditLogsUC.getFiltersMeta();
      return NextResponse.json({ success: true, data: meta });
    }

    // ─── main listing with filters ────────────────────────────────────────
    const result = await auditLogsUC.execute({
      search: searchParams.get("search") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      targetModel: searchParams.get("targetModel") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      performedById: searchParams.get("performedById") ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1", 10),
      limit: parseInt(searchParams.get("limit") ?? "50", 10),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("GET /api/v2/admin/audit-logs error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Erreur serveur" },
      { status: 500 }
    );
  }
}
