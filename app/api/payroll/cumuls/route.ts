import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";

// GET /api/payroll/cumuls?year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    // Fetch all payrolls for the given year
    const payrolls = await prisma.payroll.findMany({
      where: { year, user: { companyId: authResult.companyId } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    // 1. Cumuls par mois (1 à 12)
    const monthlyCumuls = Array.from({ length: 12 }, (_, i) => {
      const monthNumber = i + 1;
      const monthPayrolls = payrolls.filter((p) => p.month === monthNumber);

      const totalEmployees = monthPayrolls.length;
      const totalBasicSalary = monthPayrolls.reduce((sum, p) => sum + (p.basicSalary || 0), 0);
      const totalSursalaire = monthPayrolls.reduce((sum, p) => sum + (p.sursalaire || 0), 0);
      const totalGrossSalary = monthPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
      const totalBonuses = monthPayrolls.reduce((sum, p) => sum + (p.bonuses || 0), 0);
      const totalOvertimePay = monthPayrolls.reduce((sum, p) => sum + (p.overtimePay || 0), 0);
      const totalTransport = monthPayrolls.reduce((sum, p) => sum + (p.transportAllowance || 0), 0);
      const totalItsTax = monthPayrolls.reduce((sum, p) => sum + (p.itsTax || 0), 0);
      const totalIgrTax = monthPayrolls.reduce((sum, p) => sum + (p.igrTax || 0), 0);
      const totalCnpsEmployee = monthPayrolls.reduce((sum, p) => sum + (p.cnpsEmployee || 0), 0);
      const totalCnpsEmployer = monthPayrolls.reduce((sum, p) => sum + (p.cnpsEmployer || 0), 0);
      const totalFdfpTax = monthPayrolls.reduce((sum, p) => sum + (p.fdfpTax || 0), 0);
      const totalDeductions = monthPayrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);
      const totalNetSalary = monthPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

      return {
        month: monthNumber,
        monthName: monthNames[i],
        totalEmployees,
        totalBasicSalary,
        totalSursalaire,
        totalGrossSalary,
        totalBonuses,
        totalOvertimePay,
        totalTransport,
        totalItsTax,
        totalIgrTax,
        totalCnpsEmployee,
        totalCnpsEmployer,
        totalFdfpTax,
        totalDeductions,
        totalNetSalary,
      };
    });

    // 2. Cumul individuel par employé pour l'année
    const employeeMap = new Map<string, any>();

    for (const p of payrolls) {
      const uId = p.userId;
      if (!employeeMap.has(uId)) {
        employeeMap.set(uId, {
          userId: uId,
          name: p.user?.name || "Inconnu",
          employeeId: p.user?.employeeId || "EMP-000",
          department: p.user?.department?.name || "Général",
          monthsPaid: 0,
          cumulBasicSalary: 0,
          cumulSursalaire: 0,
          cumulGrossSalary: 0,
          cumulBonuses: 0,
          cumulOvertimePay: 0,
          cumulTransport: 0,
          cumulItsTax: 0,
          cumulIgrTax: 0,
          cumulCnpsEmployee: 0,
          cumulCnpsEmployer: 0,
          cumulFdfpTax: 0,
          cumulDeductions: 0,
          cumulNetSalary: 0,
        });
      }

      const emp = employeeMap.get(uId);
      emp.monthsPaid += 1;
      emp.cumulBasicSalary += p.basicSalary || 0;
      emp.cumulSursalaire += p.sursalaire || 0;
      emp.cumulGrossSalary += p.grossSalary || 0;
      emp.cumulBonuses += p.bonuses || 0;
      emp.cumulOvertimePay += p.overtimePay || 0;
      emp.cumulTransport += p.transportAllowance || 0;
      emp.cumulItsTax += p.itsTax || 0;
      emp.cumulIgrTax += p.igrTax || 0;
      emp.cumulCnpsEmployee += p.cnpsEmployee || 0;
      emp.cumulCnpsEmployer += p.cnpsEmployer || 0;
      emp.cumulFdfpTax += p.fdfpTax || 0;
      emp.cumulDeductions += p.totalDeductions || 0;
      emp.cumulNetSalary += p.netSalary || 0;
    }

    const employeeAnnualCumuls = Array.from(employeeMap.values());

    // 3. Cumul général annuel de l'entreprise
    const companyAnnualCumul = {
      year,
      totalPayrollsProcessed: payrolls.length,
      cumulGrossSalary: payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      cumulItsTax: payrolls.reduce((sum, p) => sum + (p.itsTax || 0), 0),
      cumulIgrTax: payrolls.reduce((sum, p) => sum + (p.igrTax || 0), 0),
      cumulCnpsEmployee: payrolls.reduce((sum, p) => sum + (p.cnpsEmployee || 0), 0),
      cumulCnpsEmployer: payrolls.reduce((sum, p) => sum + (p.cnpsEmployer || 0), 0),
      cumulFdfpTax: payrolls.reduce((sum, p) => sum + (p.fdfpTax || 0), 0),
      cumulTotalDeductions: payrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
      cumulNetSalary: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        year,
        monthlyCumuls,
        employeeAnnualCumuls,
        companyAnnualCumul,
      },
    });
  } catch (error) {
    console.error("Cumuls API error:", error);
    return NextResponse.json(
      { success: false, error: "Echec du calcul des cumuls de paie" },
      { status: 500 }
    );
  }
}
