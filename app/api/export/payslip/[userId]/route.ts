import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PayslipPdfService } from "@/lib/infrastructure/pdf/PayslipPdfService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    const pdfService = PayslipPdfService.getInstance();
    const { buffer, filename } = await pdfService.generatePayslipBuffer({
      userId,
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
    if (message === "EMPLOYEE_NOT_FOUND" || message === "PAYROLL_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: message === "EMPLOYEE_NOT_FOUND" ? "Employé introuvable" : "Bulletin de salaire introuvable pour ce mois", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.error("Payslip PDF export error:", error);
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la génération du PDF", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
