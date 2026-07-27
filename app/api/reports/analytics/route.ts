import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse } from "@/types";

// GET /api/reports/analytics - Indicateurs RH & Analytics de masse salariale
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const [totalEmployees, activeEmployees, departments, contracts, payrolls] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.findMany({ select: { name: true, _count: { select: { employees: true } } } }),
      prisma.contract.findMany({ where: { status: "active" }, select: { type: true, category: true } }),
      prisma.payroll.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 }),
    ]);

    // Répartition des contrats
    const contractTypes = {
      CDI: contracts.filter((c) => c.type === "CDI").length,
      CDD: contracts.filter((c) => c.type === "CDD").length,
      STAGE: contracts.filter((c) => c.type === "STAGE").length,
      FREELANCE: contracts.filter((c) => c.type === "FREELANCE").length,
    };

    // Masse salariale totale du dernier mois
    const lastMonthPayrolls = payrolls.slice(0, activeEmployees);
    const totalGrossPayroll = lastMonthPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalNetPayroll = lastMonthPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalTaxSocialCost = lastMonthPayrolls.reduce((sum, p) => sum + (p.itsTax || 0) + (p.igrTax || 0) + (p.cnpsEmployer || 0) + (p.fdfpTax || 0), 0);

    const responseData = {
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      departmentBreakdown: departments.map((d) => ({ name: d.name, count: d._count.employees })),
      contractTypes,
      lastMonthCosts: {
        totalGrossPayroll: Math.round(totalGrossPayroll),
        totalNetPayroll: Math.round(totalNetPayroll),
        totalTaxSocialCost: Math.round(totalTaxSocialCost),
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get HR analytics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch HR analytics",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
