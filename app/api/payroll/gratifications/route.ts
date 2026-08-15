import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { EmployeeRepository } from "@/lib/infrastructure/repositories/employee-repository";

const employeeRepo = new EmployeeRepository();

// GET /api/payroll/gratifications?year=2026
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);

    const employees = await employeeRepo.findAllActive(authResult.companyId);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;

    const gratifications = employees.map((emp) => {
      const joiningDate = new Date(emp.joiningDate);
      
      // Calculate presence days in reference year
      let effectiveStartDate = joiningDate < startOfYear ? startOfYear : joiningDate;
      if (effectiveStartDate > endOfYear) {
        effectiveStartDate = endOfYear;
      }

      const diffTime = Math.max(0, endOfYear.getTime() - effectiveStartDate.getTime());
      const presenceDays = Math.min(daysInYear, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      
      // Prorata percentage
      const prorata = Math.min(1.0, presenceDays / daysInYear);
      const prorataPercent = Math.round(prorata * 100);

      // Default base amount = Salary
      const baseAmount = emp.baseSalary || 0;
      const baseRate = 1.0; // 100%
      const weightedRate = baseRate * prorata;
      const gratificationAmount = Math.round(baseAmount * weightedRate);

      return {
        userId: emp.id,
        name: emp.name,
        employeeId: emp.employeeId || "-",
        department: emp.departmentName || "Général",
        joiningDate: emp.joiningDate,
        presenceDays,
        prorataPercent,
        baseAmount,
        baseRatePercent: 100,
        weightedRatePercent: prorataPercent,
        gratificationAmount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        year,
        gratifications,
        totalGratification: gratifications.reduce((sum, g) => sum + g.gratificationAmount, 0),
      },
    });
  } catch (error) {
    console.error("Gratifications API error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du calcul des gratifications" },
      { status: 500 }
    );
  }
}
