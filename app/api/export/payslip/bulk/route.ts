import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PayslipPdfService } from "@/lib/infrastructure/pdf/PayslipPdfService";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    const pdfService = PayslipPdfService.getInstance();
    const { buffer, filename } = await pdfService.generateBulkPayslipsBuffer({
      month,
      year,
      companyId: authResult.companyId,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    if (message === "NO_PAYROLLS_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun bulletin de salaire trouvé pour cette période",
        },
        { status: 404 }
      );
    }
    if (message.startsWith("BULK_LIMIT_EXCEEDED:")) {
      const [, count, max] = message.split(":");
      return NextResponse.json(
        {
          success: false,
          error: `L'export est limité à ${max} bulletins par appel (${count} demandés). Utilisez un filtre de période ou exportez par lots.`,
          code: "BULK_LIMIT_EXCEEDED",
        },
        { status: 422 }
      );
    }
    console.error("Bulk payslip export error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération des bulletins", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
