import { NextRequest, NextResponse } from "next/server";
import { Workbook } from "exceljs";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import { PrismaEmployeeExportRepository } from "@/lib/infrastructure/repositories/prisma/PrismaEmployeeExportRepository";

const employeeExportRepository = new PrismaEmployeeExportRepository();
const querySchema = z.object({ format: z.literal("excel").default("excel") });

// GET /api/export/employees?format=excel
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown> | Buffer>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsed = querySchema.safeParse({ format: request.nextUrl.searchParams.get("format") ?? "excel" });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Seul le format Excel est pris en charge", code: "INVALID_FORMAT" },
        { status: 400 }
      );
    }

    const employees = await employeeExportRepository.listActive(authResult.companyId);
    const rows = employees.map((employee) => ({
      "Employee ID": employee.employeeId || "N/A",
      Name: employee.name,
      Email: employee.email,
      Department: employee.departmentName || "N/A",
      Shift: employee.shiftName || "N/A",
      Salary: employee.salary,
      "Joining Date": employee.joiningDate ? employee.joiningDate.toLocaleDateString("en-US") : "N/A",
      Status: employee.isActive ? "Active" : "Inactive",
    }));

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Employees");
    worksheet.columns = [
      { header: "Employee ID", key: "Employee ID", width: 15 },
      { header: "Name", key: "Name", width: 20 },
      { header: "Email", key: "Email", width: 25 },
      { header: "Department", key: "Department", width: 15 },
      { header: "Shift", key: "Shift", width: 15 },
      { header: "Salary", key: "Salary", width: 12 },
      { header: "Joining Date", key: "Joining Date", width: 15 },
      { header: "Status", key: "Status", width: 12 },
    ];
    worksheet.addRows(rows);
    const buffer = await workbook.xlsx.writeBuffer();
    const dateToday = new Date().toISOString().slice(0, 10);

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="employees-export-${dateToday}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export employees error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible d’exporter les salariés", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
