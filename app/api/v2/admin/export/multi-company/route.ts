import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { BackupExportUseCase } from "@/lib/application/admin/use-cases/BackupExportUseCase";

const uc = new BackupExportUseCase();

/** POST /api/v2/admin/export/multi-company — Export multi-company aggregated CSV */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const { summary, csvContent } = await uc.generateMultiCompanyExport({
      companyIds: body.companyIds,
      year: body.year ? parseInt(body.year, 10) : undefined,
    });

    const now = new Date();
    const filename = `export_multi_entreprises_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Summary": JSON.stringify(summary),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("POST /api/v2/admin/export/multi-company error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur export multi-entreprises" },
      { status: 500 }
    );
  }
}
