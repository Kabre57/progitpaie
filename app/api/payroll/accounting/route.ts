import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";

// GET /api/payroll/accounting?month=1&year=2026 - Journal d'Imputation Comptable OHADA (SYSCOHADA)
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const payrolls = await prisma.payroll.findMany({
      where: { month, year, companyId: authResult.companyId },
    });

    let totalBasic = 0;
    let totalSursalaire = 0;
    let totalBonusesOvertimeHousing = 0;
    let totalTransport = 0;
    let totalIts = 0;
    let totalIgr = 0;
    let totalCnpsEmployee = 0;
    let totalCnpsEmployer = 0;
    let totalFdfp = 0;
    let totalNet = 0;

    payrolls.forEach((p) => {
      totalBasic += Math.round(p.basicSalary || 0);
      totalSursalaire += Math.round(p.sursalaire || 0);
      totalBonusesOvertimeHousing += Math.round((p.bonuses || 0) + (p.overtimePay || 0) + (p.housingAllowance || 0));
      totalTransport += Math.round(p.transportAllowance || 0);
      totalIts += Math.round(p.itsTax || 0);
      totalIgr += Math.round(p.igrTax || 0);
      totalCnpsEmployee += Math.round(p.cnpsEmployee || 0);
      totalCnpsEmployer += Math.round(p.cnpsEmployer || 0);
      totalFdfp += Math.round(p.fdfpTax || 0);
      totalNet += Math.round(p.netSalary || 0);
    });

    // Écritures comptables de centralisation de paie aux normes SYSCOHADA (OHADA)
    const journalVouchers = [
      { account: "661100", label: "Salaires de base & sursalaire", debit: totalBasic + totalSursalaire, credit: 0 },
      { account: "661200", label: "Primes, indemnités et gratifications", debit: totalBonusesOvertimeHousing, credit: 0 },
      { account: "661300", label: "Indemnités non imposables (Transport)", debit: totalTransport, credit: 0 },
      { account: "664100", label: "Charges sociales patronales CNPS (16.45%)", debit: totalCnpsEmployer, credit: 0 },
      { account: "664200", label: "Taxes et contributions FDFP (1.6%)", debit: totalFdfp, credit: 0 },
      { account: "421100", label: "Personnel, salaires dus (Net à payer)", debit: 0, credit: totalNet },
      { account: "431100", label: "Sécurité sociale CNPS dues (Salariés + Patronal)", debit: 0, credit: totalCnpsEmployee + totalCnpsEmployer },
      { account: "447100", label: "Impôts retenus à la source DGI (ITS/IS + IGR)", debit: 0, credit: totalIts + totalIgr },
      { account: "447200", label: "Taxes sur salaires FDFP dues", debit: 0, credit: totalFdfp },
    ];

    const totalDebit = journalVouchers.reduce((s, v) => s + v.debit, 0);
    const totalCredit = journalVouchers.reduce((s, v) => s + v.credit, 0);

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        journalVouchers,
        totalDebit,
        totalCredit,
        isBalanced: totalDebit === totalCredit,
      },
    });
  } catch (error) {
    console.error("Accounting journal error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du calcul du journal comptable" },
      { status: 500 }
    );
  }
}
