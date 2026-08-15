import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceExportRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceExportRepository";
import { Workbook } from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { z } from "zod";
import { ApiResponse } from "@/types";

const attendanceExportRepository = new PrismaAttendanceExportRepository();

const attendanceExportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  dept: z.string().trim().min(1).optional(),
  format: z.enum(["excel", "pdf"]).optional(),
});

// GET /api/export/attendance?month=1&year=2025&dept=deptId&format=excel|pdf
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown> | Buffer>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsedQuery = attendanceExportQuerySchema.safeParse(searchParams);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres d’export invalides", details: parsedQuery.error.issues },
        { status: 400 }
      );
    }

    const now = new Date();
    const month = parsedQuery.data.month ?? now.getMonth() + 1;
    const year = parsedQuery.data.year ?? now.getFullYear();
    const deptId = parsedQuery.data.dept;
    const format = parsedQuery.data.format ?? "excel";

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const { employees: users, records: attendanceRecords } = await attendanceExportRepository.list(
      authResult.companyId,
      deptId,
      startOfMonth.toISOString().slice(0, 10),
      endOfMonth.toISOString().slice(0, 10)
    );
    const attendanceMap = new Map<string, (typeof attendanceRecords)[number]>();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(`${record.userId}_${record.date}`, record);
    });

    const rows: Array<{
      "Employee Name": string;
      "Employee ID": string;
      Department: string;
      Date: string;
      "Check-in": string;
      "Check-out": string;
      Status: string;
      "Working Hours": number | string;
    }> = [];

    for (const user of users) {
      for (let d = 1; d <= endOfMonth.getDate(); d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const record = attendanceMap.get(`${user.id}_${dateStr}`);

        rows.push({
          "Employee Name": user.name,
          "Employee ID": user.employeeId || "N/A",
          Department: user.departmentName || "N/A",
          Date: dateStr,
          "Check-in": record?.checkIn
            ? new Date(record.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "-",
          "Check-out": record?.checkOut
            ? new Date(record.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "-",
          Status: record?.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "Absent",
          "Working Hours": record?.hoursWorked ? record.hoursWorked.toFixed(2) : "0.00",
        });
      }
    }

    const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
    const dateToday = new Date().toISOString().split("T")[0];

    if (format === "excel") {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Attendance");
      worksheet.columns = [
        { header: "Employee Name", key: "Employee Name", width: 20 },
        { header: "Employee ID", key: "Employee ID", width: 15 },
        { header: "Department", key: "Department", width: 15 },
        { header: "Date", key: "Date", width: 12 },
        { header: "Check-in", key: "Check-in", width: 12 },
        { header: "Check-out", key: "Check-out", width: 12 },
        { header: "Status", key: "Status", width: 12 },
        { header: "Working Hours", key: "Working Hours", width: 15 },
      ];
      worksheet.addRows(rows);

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="attendance-${monthName.toLowerCase()}-${year}-${dateToday}.xlsx"`,
        },
      });
    } else if (format === "pdf") {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Attendance Report - ${monthName} ${year}`, 14, 20);

      autoTable(doc, {
        head: [["Employee Name", "Employee ID", "Department", "Date", "Check-in", "Check-out", "Status", "Hours"]],
        body: rows.map((r) => [
          r["Employee Name"],
          r["Employee ID"],
          r.Department,
          r.Date,
          r["Check-in"],
          r["Check-out"],
          r.Status,
          r["Working Hours"],
        ]),
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Generated on ${dateToday}`, 14, doc.internal.pageSize.height - 10);
      }

      const pdfBuffer = doc.output("arraybuffer");

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="attendance-${monthName.toLowerCase()}-${year}-${dateToday}.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid format. Use 'excel' or 'pdf'",
          code: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Export attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export attendance",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
