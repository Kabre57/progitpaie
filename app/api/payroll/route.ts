import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { LeaveType, LeaveStatus, AttendanceStatus, PayrollStatus, Prisma } from "@prisma/client";
import { ApiResponse, GeneratePayrollBody } from "@/types";
import { calculatePayrollTaxes } from "@/lib/payroll-tax";

// POST /api/payroll/generate - Generate payroll for all employees with tax & overtime calculation
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: GeneratePayrollBody = await request.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        {
          success: false,
          error: "Month and year are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Get all active employees
    const employees = await prisma.user.findMany({ where: { isActive: true } });
    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existing = await prisma.payroll.findUnique({
          where: {
            userId_month_year: {
              userId: employee.id,
              month,
              year,
            },
          },
        });

        if (existing) {
          continue;
        }

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            userId: employee.id,
            date: {
              gte: startOfMonth.toISOString().split("T")[0],
              lte: endOfMonth.toISOString().split("T")[0],
            },
          },
        });

        const presentDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.present).length;
        const lateDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.late).length;
        const absentDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.absent).length;
        const halfDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.half_day).length;
        const leaveDays = attendanceRecords.filter((r) => r.status === AttendanceStatus.on_leave).length;

        // Calculate Overtime Pay from Attendance records
        const hourlyRate = (employee.salary || 0) / (26 * 8); // 26 working days * 8h
        let overtimePay = 0;
        attendanceRecords.forEach((r) => {
          if (r.overtimeMinutes > 0) {
            const hours = r.overtimeMinutes / 60;
            const rateMultiplier = r.overtimeRate || 1.15; // default 15%
            overtimePay += hours * hourlyRate * rateMultiplier;
          }
        });
        overtimePay = Math.round(overtimePay);

        const unpaidLeaves = await prisma.leave.findMany({
          where: {
            userId: employee.id,
            leaveType: LeaveType.unpaid,
            status: LeaveStatus.approved,
            startDate: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        const unpaidLeaveDays = unpaidLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);

        const basicSalary = employee.salary || 0;
        const perDaySalary = basicSalary / 26;

        const absentDeduction = Math.round(absentDays * perDaySalary);
        const lateDeduction = Math.round(Math.floor(lateDays / 3) * perDaySalary);
        const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * perDaySalary);

        // Run Tax & Contribution Calculation Engine
        const taxResult = calculatePayrollTaxes({
          basicSalary,
          sursalaire: employee.sursalaire || 0,
          transportAllowance: employee.transportAllowance || 0,
          housingAllowance: employee.housingAllowance || 0,
          overtimePay,
          bonuses: 0,
          partsIGR: employee.partsIGR || 1.0,
          absentDeduction,
          lateDeduction,
          unpaidLeaveDeduction,
        });

        const payroll = await prisma.payroll.create({
          data: {
            userId: employee.id,
            month,
            year,
            basicSalary,
            sursalaire: employee.sursalaire || 0,
            transportAllowance: employee.transportAllowance || 0,
            housingAllowance: employee.housingAllowance || 0,
            presentDays: presentDays + lateDays + halfDays * 0.5,
            absentDays,
            lateDays,
            leaveDays,
            unpaidLeaveDays,
            overtimePay,
            absentDeduction,
            lateDeduction,
            unpaidLeaveDeduction,
            bonuses: 0,
            grossSalary: taxResult.grossSalary,
            itsTax: taxResult.itsTax,
            igrTax: taxResult.igrTax,
            cnpsEmployee: taxResult.cnpsEmployee,
            cnpsEmployer: taxResult.cnpsEmployer,
            fdfpTax: taxResult.fdfpTax,
            totalDeductions: taxResult.totalDeductions,
            netSalary: taxResult.netSalary,
            status: PayrollStatus.draft,
          },
        });

        results.push(payroll);
      } catch (err) {
        errors.push(`${employee.name}: ${err instanceof Error ? err.message : "Error"}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          generated: results.length,
          errors: errors.length > 0 ? errors : undefined,
        },
        message: `Generated payroll for ${results.length} employees`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate payroll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate payroll",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET /api/payroll - Get all payroll records (admin)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "0", 10);
    const year = parseInt(searchParams.get("year") || "0", 10);
    const status = searchParams.get("status");

    const where: Prisma.PayrollWhereInput = {};

    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status as PayrollStatus;

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    const formattedPayrolls = payrolls.map((p) => ({
      ...p,
      _id: p.id,
      userId: {
        ...p.user,
        _id: p.user.id,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedPayrolls,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get payroll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payroll",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
