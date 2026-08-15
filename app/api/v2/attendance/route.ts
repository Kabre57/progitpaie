import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { listAttendanceQuerySchema } from "@/shared/validation/attendance-v2.schema";
import { ApiResponse } from "@/types";

const attendanceRepo = new PrismaAttendanceRepository();

// GET /api/v2/attendance - Liste des pointages avec filtre mois et calcul automatique des heures
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listAttendanceQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de requête invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    let startDate = parseResult.data.startDate;
    let endDate = parseResult.data.endDate;

    if (!startDate && !endDate && parseResult.data.month) {
      const [y, m] = parseResult.data.month.split("-").map(Number);
      if (y && m) {
        const lastDay = new Date(y, m, 0).getDate();
        startDate = `${y}-${String(m).padStart(2, "0")}-01`;
        endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      }
    }

    const records = await attendanceRepo.list({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      status: parseResult.data.status,
      startDate,
      endDate,
      departmentId: parseResult.data.departmentId,
    });

    const formatted = records.map((r) => {
      let hoursWorked = r.workDuration.hoursWorked;
      if (hoursWorked === 0) {
        if (r.checkIn && r.checkOut) {
          const diffMs = r.checkOut.getTime() - r.checkIn.getTime();
          const elapsed = Math.floor(diffMs / (1000 * 60));
          hoursWorked = elapsed >= 540 ? 8.0 : elapsed > 0 ? Math.round((Math.min(elapsed, 480) / 60) * 10) / 10 : 8.0;
        } else if (r.status.value === "present" || r.status.value === "late") {
          hoursWorked = 8.0;
        } else if (r.status.value === "half_day") {
          hoursWorked = 4.0;
        }
      }

      const statusVal = r.status.value;
      const formattedStatus = statusVal === "half_day" ? "half-day" : statusVal === "on_leave" ? "on-leave" : statusVal;

      return {
        _id: r.id,
        id: r.id,
        userId: {
          _id: r.userId,
          id: r.userId,
          name: "Salarié",
          email: "",
          employeeId: undefined,
        },
        date: r.date,
        checkIn: r.checkIn.toISOString(),
        checkOut: r.checkOut ? r.checkOut.toISOString() : null,
        status: formattedStatus,
        hoursWorked,
        notes: r.notes || "",
        overtimeMinutes: r.workDuration.overtimeMinutes,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          records: formatted,
          total: formatted.length,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/v2/attendance error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json(
      { success: false, error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
