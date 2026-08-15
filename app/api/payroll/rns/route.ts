import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaPayrollRepository } from "@/lib/infrastructure/repositories/prisma/PrismaPayrollRepository";

const payrollRepo = new PrismaPayrollRepository();

// GET /api/payroll/rns?userId=xxx
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const domainPayrolls = await payrollRepo.list({
      companyId: authResult.companyId,
      ...(userId ? { userId } : {}),
    });

    // Group by employee and year
    type RnsYear = {
      year: number;
      monthsWorked: number;
      grossCnpsSalary: number;
    };
    type RnsEmployee = {
      userId: string;
      name: string;
      employeeId: string;
      cnpsNumber: string;
      joiningDate: Date | null;
      exitDate: Date | null;
      jobTitle: string;
      years: Record<number, RnsYear>;
    };
    const employeeRnsMap: Record<string, RnsEmployee> = {};

    for (const p of domainPayrolls) {
      const uId = p.userId;
      if (!employeeRnsMap[uId]) {
        employeeRnsMap[uId] = {
          userId: p.userId,
          name: "Collaborateur",
          employeeId: "-",
          cnpsNumber: "N/A",
          joiningDate: null,
          exitDate: null,
          jobTitle: "Collaborateur",
          years: {},
        };
      }

      const y = p.period.year;
      if (!employeeRnsMap[uId].years[y]) {
        employeeRnsMap[uId].years[y] = {
          year: y,
          monthsWorked: 0,
          grossCnpsSalary: 0,
        };
      }

      employeeRnsMap[uId].years[y].monthsWorked += 1;
      employeeRnsMap[uId].years[y].grossCnpsSalary += Math.round(p.grossSalary.toNumber());
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
