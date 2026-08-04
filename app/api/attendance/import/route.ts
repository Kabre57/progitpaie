import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { AttendanceStatus } from "@prisma/client";
import { ApiResponse } from "@/types";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// POST /api/attendance/import - Bulk import attendance from CSV
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ImportResult>>> {
  try {
    // Check admin authorization
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file must have a header row and at least one data row",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const employeeIdIdx = headers.indexOf("employeeid");
    const dateIdx = headers.indexOf("date");
    const checkInIdx = headers.indexOf("checkin");
    const checkOutIdx = headers.indexOf("checkout");
    const statusIdx = headers.indexOf("status");

    if (employeeIdIdx === -1 || dateIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV must have 'employeeId' and 'date' columns",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue;

      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of row) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const employeeId = values[employeeIdIdx]?.trim();
      const dateStr = values[dateIdx]?.trim();
      const checkInStr = checkInIdx >= 0 ? values[checkInIdx]?.trim() : null;
      const checkOutStr = checkOutIdx >= 0 ? values[checkOutIdx]?.trim() : null;
      const statusStr = statusIdx >= 0 ? values[statusIdx]?.trim() : "present";

      if (!employeeId || !dateStr) {
        result.skipped++;
        result.errors.push(`Row ${i}: Missing required fields`);
        continue;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        result.skipped++;
        result.errors.push(`Row ${i}: Invalid date format (use YYYY-MM-DD)`);
        continue;
      }

      try {
        const user = await prisma.user.findFirst({
          where: { employeeId, companyId: authResult.companyId },
        });
        if (!user) {
          result.skipped++;
          result.errors.push(`Row ${i}: Employee not found (${employeeId})`);
          continue;
        }

        const existingRecord = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId: user.id,
              date: dateStr,
            },
          },
        });

        if (existingRecord) {
          result.skipped++;
          result.errors.push(`Row ${i}: Attendance already exists for ${employeeId} on ${dateStr}`);
          continue;
        }

        let checkIn: Date;
        let checkOut: Date | null = null;
        let hoursWorked = 0;
        let workingMinutes = 0;

        if (checkInStr) {
          const [hours, minutes] = checkInStr.split(":").map(Number);
          checkIn = new Date(dateStr);
          checkIn.setHours(hours || 0, minutes || 0, 0, 0);
        } else {
          checkIn = new Date(dateStr);
          checkIn.setHours(9, 0, 0, 0);
        }

        if (checkOutStr) {
          const [hours, minutes] = checkOutStr.split(":").map(Number);
          checkOut = new Date(dateStr);
          checkOut.setHours(hours || 0, minutes || 0, 0, 0);

          const diffMs = checkOut.getTime() - checkIn.getTime();
          workingMinutes = Math.floor(diffMs / (1000 * 60));
          hoursWorked = Number((workingMinutes / 60).toFixed(2));
        }

        let prismaStatus: AttendanceStatus = AttendanceStatus.present;
        const normalizedStatus = statusStr.toLowerCase();
        if (normalizedStatus === "absent") prismaStatus = AttendanceStatus.absent;
        else if (normalizedStatus === "late") prismaStatus = AttendanceStatus.late;
        else if (normalizedStatus === "half-day") prismaStatus = AttendanceStatus.half_day;
        else if (normalizedStatus === "on-leave") prismaStatus = AttendanceStatus.on_leave;

        await prisma.attendance.create({
          data: {
            companyId: authResult.companyId,
            userId: user.id,
            date: dateStr,
            checkIn,
            checkOut,
            status: prismaStatus,
            hoursWorked,
            workingMinutes,
            notes: "Imported via CSV",
          },
        });

        result.imported++;
      } catch (err) {
        result.skipped++;
        result.errors.push(
          `Row ${i}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Import complete: ${result.imported} imported, ${result.skipped} skipped`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import attendance",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
