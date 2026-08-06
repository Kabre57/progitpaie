import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { GetAuditLogsUseCase } from "@/lib/application/admin/use-cases/GetAuditLogsUseCase";

const auditLogsUC = new GetAuditLogsUseCase();

function escapeCSV(value: string | undefined | null): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);

    // Fetch up to 5 000 rows for export
    const result = await auditLogsUC.execute({
      search: searchParams.get("search") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      targetModel: searchParams.get("targetModel") ?? undefined,
      companyId: searchParams.get("companyId") ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      page: 1,
      limit: 5000,
    });

    // ─── Build CSV ─────────────────────────────────────────────────────────
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    const headers = [
      "Date & Heure",
      "Entreprise",
      "Action",
      "Modèle Ciblé",
      "ID Ressource",
      "Effectué Par",
      "Email",
      "Adresse IP",
    ];

    const rows = result.logs.map((log) => [
      new Date(log.timestamp).toLocaleString("fr-FR"),
      log.companyName,
      log.action,
      log.targetModel,
      log.targetId ?? "",
      log.performedByName,
      log.performedByEmail,
      log.ipAddress ?? "",
    ]);

    const csv =
      BOM +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const now = new Date();
    const filename = `audit-logs-groupe_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("GET /api/v2/admin/audit-logs/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur export CSV" },
      { status: 500 }
    );
  }
}
