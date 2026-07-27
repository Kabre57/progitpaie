import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse } from "@/types";

export interface JournalRow {
  date: string;
  piece: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
}

// GET /api/accounting/journal?month=1&year=2026 - Journal d'imputations comptables SYSCOHADA
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const periodStr = `${year}-${String(month).padStart(2, "0")}`;
    const journalDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

    // Récupérer toutes les fiches de paie générées du mois
    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: {
        user: { select: { name: true, employeeId: true } },
      },
    });

    if (payrolls.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            period: periodStr,
            journalRows: [],
            totalDebit: 0,
            totalCredit: 0,
            message: "Aucune fiche de paie générée pour ce mois.",
          },
        },
        { status: 200 }
      );
    }

    // Cumul des montants pour le journal comptable
    let totalBasicSursalaire = 0;
    let totalPrimesOvertime = 0;
    let totalTransport = 0;
    let totalITS = 0;
    let totalIGR = 0;
    let totalCNPSSalarie = 0;
    let totalCNPSPatronal = 0;
    let totalFDFP = 0;
    let totalNet = 0;

    payrolls.forEach((p) => {
      totalBasicSursalaire += (p.basicSalary || 0) + (p.sursalaire || 0);
      totalPrimesOvertime += (p.bonuses || 0) + (p.overtimePay || 0);
      totalTransport += p.transportAllowance || 0;
      totalITS += p.itsTax || 0;
      totalIGR += p.igrTax || 0;
      totalCNPSSalarie += p.cnpsEmployee || 0;
      totalCNPSPatronal += p.cnpsEmployer || 0;
      totalFDFP += p.fdfpTax || 0;
      totalNet += p.netSalary || 0;
    });

    const piece = `PAIE-${periodStr}`;

    const journalRows: JournalRow[] = [
      // 1. DÉBITS (Charges de personnel - Comptes Classe 6)
      { date: journalDate, piece, accountNumber: "661100", accountName: "Appointements, Salaires & Sursalaire", debit: Math.round(totalBasicSursalaire), credit: 0 },
      { date: journalDate, piece, accountNumber: "661200", accountName: "Primes & Heures Supplémentaires", debit: Math.round(totalPrimesOvertime), credit: 0 },
      { date: journalDate, piece, accountNumber: "663400", accountName: "Indemnités de transport", debit: Math.round(totalTransport), credit: 0 },
      { date: journalDate, piece, accountNumber: "664100", accountName: "Charges sociales patronales (CNPS)", debit: Math.round(totalCNPSPatronal), credit: 0 },
      { date: journalDate, piece, accountNumber: "664800", accountName: "Taxes sur salaires patronales (FDFP)", debit: Math.round(totalFDFP), credit: 0 },

      // 2. CRÉDITS (Dettes & Retenues - Comptes Classe 4)
      { date: journalDate, piece, accountNumber: "447200", accountName: "Impôts sur Salaires (ITS & IGR)", debit: 0, credit: Math.round(totalITS + totalIGR) },
      { date: journalDate, piece, accountNumber: "431310", accountName: "CNPS Part Salariée", debit: 0, credit: Math.round(totalCNPSSalarie) },
      { date: journalDate, piece, accountNumber: "431320", accountName: "CNPS Part Patronale", debit: 0, credit: Math.round(totalCNPSPatronal) },
      { date: journalDate, piece, accountNumber: "447800", accountName: "Taxes FDFP à payer", debit: 0, credit: Math.round(totalFDFP) },
      { date: journalDate, piece, accountNumber: "422000", accountName: "Personnel, Rémunérations dues (Nets à payer)", debit: 0, credit: Math.round(totalNet) },
    ];

    const totalDebit = journalRows.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = journalRows.reduce((sum, r) => sum + r.credit, 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          period: periodStr,
          journalRows,
          totalDebit,
          totalCredit,
          isBalanced: totalDebit === totalCredit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get accounting journal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate accounting journal",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
