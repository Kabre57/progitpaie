import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";

// GET /api/declarations/its?month=1&year=2026 - Déclaration Mensuelle ITS (DGI)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const periodStr = `${year}/${String(month).padStart(2, "0")}`;

    const payrolls = await prisma.payroll.findMany({
      where: { month, year, user: { companyId: authResult.companyId } },
      include: {
        user: { select: { name: true, employeeId: true } },
      },
    });

    let totalBrutImposable = 0;
    let totalITS = 0;
    let totalIGR = 0;
    let totalEmployees = payrolls.length;

    payrolls.forEach((p) => {
      totalBrutImposable += p.grossSalary || 0;
      totalITS += p.itsTax || 0;
      totalIGR += p.igrTax || 0;
    });

    const responseData = {
      period: periodStr,
      country: "Côte d'Ivoire",
      authority: "Direction Générale des Impôts (DGI)",
      formName: "Déclaration des Impôts sur les Traitements et Salaires (ITS)",
      totalEmployees,
      totalGrossSalary: Math.round(totalBrutImposable),
      totalITS: Math.round(totalITS),
      totalIGR: Math.round(totalIGR),
      totalTaxToPay: Math.round(totalITS + totalIGR),
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get ITS declaration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate ITS declaration",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
