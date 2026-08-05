import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAccountingRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAccountingRepository";
import { GetPayrollJournalUseCase } from "@/lib/application/accounting/use-cases/GetPayrollJournalUseCase";
import * as XLSX from "xlsx";
import { ApiResponse } from "@/types";

const repository = new PrismaAccountingRepository();
const useCase = new GetPayrollJournalUseCase(repository);

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const data = await useCase.execute(authResult.companyId, month, year);

    const piece = `PAIE-${data.period}`;

    const rows = data.journalRows.map((r) => ({
      Jour: r.date.split("-")[2],
      "N° Pièce": piece,
      "Référence": `PAIE ${data.period}`,
      "N° Compte Général": r.accountNumber,
      "Libellé Écriture": r.accountName,
      Débit: r.debit,
      Crédit: r.credit,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Journal");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="journal-comptable-${data.period}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v2/accounting/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'exportation", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
