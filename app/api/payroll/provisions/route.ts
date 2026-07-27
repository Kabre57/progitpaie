import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";

// GET /api/payroll/provisions?year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        joiningDate: true,
        salary: true,
        sursalaire: true,
        regime: true,
      },
    });

    const leaveProvisions: any[] = [];
    const retirementProvisions: any[] = [];

    const refDate = new Date(year, 11, 31);

    users.forEach((u) => {
      const grossMonthly = (u.salary || 0) + (u.sursalaire || 0) + 50000; // Average gross
      const joining = new Date(u.joiningDate);
      const diffDays = Math.max(0, (refDate.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24));
      const seniorityYears = Math.max(0, diffDays / 365.25);

      // Provision Congés (37-PROVISION CONGES) - 1/10 des rémunérations brutes acquises
      const leaveDaysAccrued = Math.round(seniorityYears * 26.4);
      const leaveProvisionAmount = Math.round((grossMonthly / 30) * leaveDaysAccrued);

      leaveProvisions.push({
        userId: u.id,
        name: u.name,
        employeeId: u.employeeId || "EMP-001",
        joiningDate: u.joiningDate,
        grossMonthly,
        leaveDaysAccrued,
        provisionAmount: leaveProvisionAmount,
      });

      // Provision Retraite (38-PROVISION RETRAITE) - Barème Ivoirien (30% 1-5 ans, 35% 6-10 ans, 40% 10+ ans)
      let tranche1 = 0;
      let tranche2 = 0;
      let tranche3 = 0;

      if (seniorityYears >= 1) {
        tranche1 = Math.min(seniorityYears, 5) * grossMonthly * 0.30;
      }
      if (seniorityYears > 5) {
        tranche2 = Math.min(seniorityYears - 5, 5) * grossMonthly * 0.35;
      }
      if (seniorityYears > 10) {
        tranche3 = (seniorityYears - 10) * grossMonthly * 0.40;
      }

      const retirementProvisionAmount = Math.round(tranche1 + tranche2 + tranche3);

      retirementProvisions.push({
        userId: u.id,
        name: u.name,
        employeeId: u.employeeId || "EMP-001",
        joiningDate: u.joiningDate,
        seniorityYears: seniorityYears.toFixed(1),
        grossMonthly,
        provisionAmount: retirementProvisionAmount,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        year,
        leaveProvisions,
        totalLeaveProvision: leaveProvisions.reduce((sum, item) => sum + item.provisionAmount, 0),
        retirementProvisions,
        totalRetirementProvision: retirementProvisions.reduce((sum, item) => sum + item.provisionAmount, 0),
      },
    });
  } catch (error) {
    console.error("Provisions API error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du calcul des provisions congés et retraite" },
      { status: 500 }
    );
  }
}
