import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import * as XLSX from "xlsx";
import { ApiResponse } from "@/types";

// GET /api/export/employees?format=excel
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown> | Buffer>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel";

    if (format !== "excel") {
      return NextResponse.json(
        {
          success: false,
          error: "Only Excel format is supported for employees export",
          code: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }

    const employees = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        employeeId: true,
        name: true,
        email: true,
        department: { select: { name: true } },
        shift: { select: { name: true } },
        salary: true,
        joiningDate: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    const rows = employees.map((emp) => ({
      "Employee ID": emp.employeeId || "N/A",
      Name: emp.name,
      Email: emp.email,
      Department: emp.department?.name || "N/A",
      Shift: emp.shift?.name || "N/A",
      Salary: emp.salary || 0,
      "Joining Date": emp.joiningDate
        ? new Date(emp.joiningDate).toLocaleDateString("en-US")
        : "N/A",
      Status: emp.isActive ? "Active" : "Inactive",
    }));

    const dateToday = new Date().toISOString().split("T")[0];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    ws["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Employees");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="employees-export-${dateToday}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export employees error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export employees",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
