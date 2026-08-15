import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Workbook } from "exceljs";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAccountingRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAccountingRepository";
import { GetPayrollJournalUseCase } from "@/lib/application/accounting/use-cases/GetPayrollJournalUseCase";

const journalQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const repository = new PrismaAccountingRepository();
const useCase = new GetPayrollJournalUseCase(repository);

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsedQuery = journalQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Période comptable invalide", details: parsedQuery.error.issues },
        { status: 400 }
      );
    }

    const now = new Date();
    const month = parsedQuery.data.month ?? now.getMonth() + 1;
    const year = parsedQuery.data.year ?? now.getFullYear();
    const data = await useCase.execute(authResult.companyId, month, year);
    const piece = `PAIE-${data.period}`;

    const rows = data.journalRows.map((row) => ({
      Jour: row.date.split("-")[2],
      "N° Pièce": piece,
      Référence: `PAIE ${data.period}`,
      "N° Compte Général": row.accountNumber,
      "Libellé Écriture": row.accountName,
      Débit: row.debit,
      Crédit: row.credit,
    }));

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Journal");
    worksheet.columns = [
      { header: "Jour", key: "Jour", width: 8 },
      { header: "N° Pièce", key: "N° Pièce", width: 15 },
      { header: "Référence", key: "Référence", width: 15 },
      { header: "N° Compte Général", key: "N° Compte Général", width: 18 },
      { header: "Libellé Écriture", key: "Libellé Écriture", width: 40 },
      { header: "Débit", key: "Débit", width: 15 },
      { header: "Crédit", key: "Crédit", width: 15 },
    ];
    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="journal-comptable-${data.period}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/v2/accounting/export error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'exportation", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
