import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";

// GET /api/payroll/rns?userId=xxx
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Fetch payroll history grouped by year
    const payrolls = await prisma.payroll.findMany({
      where: { ...(userId ? { userId } : {}), user: { companyId: authResult.companyId } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            cnpsNumber: true,
            joiningDate: true,
            exitDate: true,
            jobTitle: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "asc" }],
    });

    // Group by employee and year
    const employeeRnsMap: Record<string, any> = {};

    for (const p of payrolls) {
      const uId = p.userId;
      if (!employeeRnsMap[uId]) {
        employeeRnsMap[uId] = {
          userId: p.user.id,
          name: p.user.name,
          employeeId: p.user.employeeId || "EMP-000",
          cnpsNumber: p.user.cnpsNumber || "N/A",
          joiningDate: p.user.joiningDate,
          exitDate: p.user.exitDate,
          jobTitle: p.user.jobTitle || "Collaborateur",
          years: {},
        };
      }

      const y = p.year;
      if (!employeeRnsMap[uId].years[y]) {
        employeeRnsMap[uId].years[y] = {
          year: y,
          monthsWorked: 0,
          grossCnpsSalary: 0,
        };
      }

      employeeRnsMap[uId].years[y].monthsWorked += 1;
      employeeRnsMap[uId].years[y].grossCnpsSalary += Math.round(p.grossSalary);
    }

    const data = Object.values(employeeRnsMap);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get RNS data error:", error);
    return NextResponse.json(
      { success: false, error: "Échec de la récupération des données RNS CNPS" },
      { status: 500 }
    );
  }
}
