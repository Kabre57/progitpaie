import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ApiResponse } from "@/types";

// GET /api/export/attendance?month=1&year=2025&dept=deptId&format=excel|pdf
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown> | Buffer>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "", 10);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "", 10);
    const deptId = searchParams.get("dept");
    const format = searchParams.get("format") || "excel";

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const userWhere: any = { isActive: true, companyId: authResult.companyId };
    if (deptId) {
      userWhere.departmentId = deptId;
    }

    // Filtre companyId obligatoire : garantit l'isolation tenant
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        employeeId: true,
        department: { select: { name: true } },
      },
    });

    const userIds = users.map((u) => u.id);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: { in: userIds },
        companyId: authResult.companyId,
        date: {
          gte: startOfMonth.toISOString().split("T")[0],
          lte: endOfMonth.toISOString().split("T")[0],
        },
      },
    });

    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
      const key = `${record.userId}_${record.date}`;
      attendanceMap.set(key, record);
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
          Department: user.department?.name || "N/A",
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
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      ws["!cols"] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
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

      (doc as any).autoTable({
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

      const pageCount = (doc as any).internal.pages.length;
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
  } catch (error) {
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
