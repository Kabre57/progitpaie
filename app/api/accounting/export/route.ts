import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import * as XLSX from "xlsx";
import { ApiResponse } from "@/types";

// GET /api/accounting/export?month=1&year=2026 - Exporter le journal comptable  
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown> | Buffer>> {
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

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
    });

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

    const rows = [
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "661100", "Libellé Écriture": "Appointements, Salaires & Sursalaire", Débit: Math.round(totalBasicSursalaire), Crédit: 0 },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "661200", "Libellé Écriture": "Primes & Heures Supplémentaires", Débit: Math.round(totalPrimesOvertime), Crédit: 0 },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "663400", "Libellé Écriture": "Indemnités de transport", Débit: Math.round(totalTransport), Crédit: 0 },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "664100", "Libellé Écriture": "Charges sociales patronales (CNPS)", Débit: Math.round(totalCNPSPatronal), Crédit: 0 },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "664800", "Libellé Écriture": "Taxes sur salaires patronales (FDFP)", Débit: Math.round(totalFDFP), Crédit: 0 },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "447200", "Libellé Écriture": "Impôts sur Salaires (ITS & IGR)", Débit: 0, Crédit: Math.round(totalITS + totalIGR) },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "431310", "Libellé Écriture": "CNPS Part Salariée", Débit: 0, Crédit: Math.round(totalCNPSSalarie) },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "431320", "Libellé Écriture": "CNPS Part Patronale", Débit: 0, Crédit: Math.round(totalCNPSPatronal) },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "447800", "Libellé Écriture": "Taxes FDFP à payer", Débit: 0, Crédit: Math.round(totalFDFP) },
      { Jour: journalDate.split("-")[2], "N° Pièce": piece, "Référence": `PAIE ${periodStr}`, "N° Compte Général": "422000", "Libellé Écriture": "Personnel, Rémunérations dues (Nets à payer)", Débit: 0, Crédit: Math.round(totalNet) },
    ];

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

    XLSX.utils.book_append_sheet(wb, ws, "  Journal");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="journal-comptable-${periodStr}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export accounting error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export accounting journal",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
