import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse } from "@/types";

// GET /api/declarations/cnps?month=1&year=2026 - Appel de Cotisation Mensuel CNPS
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

    const periodStr = `${year}/${String(month).padStart(2, "0")}`;

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: {
        user: { select: { name: true, employeeId: true } },
      },
    });

    let totalBrut = 0;
    let totalCNPSSalarié = 0;
    let totalCNPSPatronal = 0;
    let totalEmployees = payrolls.length;

    payrolls.forEach((p) => {
      totalBrut += p.grossSalary || 0;
      totalCNPSSalarié += p.cnpsEmployee || 0;
      totalCNPSPatronal += p.cnpsEmployer || 0;
    });

    const responseData = {
      period: periodStr,
      authority: "Caisse Nationale de Prévoyance Sociale (CNPS)",
      formName: "Appel de Cotisation Mensuel & Liste Nominative",
      totalEmployees,
      totalGrossSalary: Math.round(totalBrut),
      cnpsEmployeeTotal: Math.round(totalCNPSSalarié),
      cnpsEmployerTotal: Math.round(totalCNPSPatronal),
      totalCNPSToPay: Math.round(totalCNPSSalarié + totalCNPSPatronal),
      employeeDetails: payrolls.map((p) => ({
        employeeId: p.user.employeeId || "N/A",
        name: p.user.name,
        grossSalary: Math.round(p.grossSalary || 0),
        cnpsEmployee: Math.round(p.cnpsEmployee || 0),
        cnpsEmployer: Math.round(p.cnpsEmployer || 0),
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get CNPS declaration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate CNPS declaration",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
