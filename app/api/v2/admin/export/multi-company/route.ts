import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { BackupExportUseCase } from "@/lib/application/admin/use-cases/BackupExportUseCase";

const exportSchema = z.object({
  companyIds: z.array(z.string().trim().min(1).max(100)).min(1).max(500),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const uc = new BackupExportUseCase();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = exportSchema.parse(await request.json());
    const { csvContent } = await uc.generateMultiCompanyExport({
      companyIds: body.companyIds,
      year: body.year,
    });

    const now = new Date();
    const filename = `export_multi_entreprises_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.csv`;
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const isValidationError = error instanceof z.ZodError;
    console.error("POST /api/v2/admin/export/multi-company error:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      {
        success: false,
        error: isValidationError ? "Paramètres d’export invalides" : "Erreur export multi-entreprises",
        code: isValidationError ? "INVALID_EXPORT" : "EXPORT_ERROR",
      },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
