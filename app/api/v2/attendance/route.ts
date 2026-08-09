import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { listAttendanceQuerySchema } from "@/shared/validation/attendance-v2.schema";
import { ApiResponse } from "@/types";

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

    const records = await prisma.attendance.findMany({
      where: {
        companyId: authResult.companyId,
        ...(parseResult.data.userId || authResult.role === "employee"
          ? { userId: parseResult.data.userId || authResult.userId }
          : {}),
        ...(parseResult.data.status ? { status: parseResult.data.status as any } : {}),
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(parseResult.data.departmentId
          ? { user: { departmentId: parseResult.data.departmentId } }
          : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, employeeId: true },
        },
      },
      orderBy: [{ date: "desc" }, { checkIn: "desc" }],
    });

    const formatted = records.map((r) => {
      let hoursWorked = r.hoursWorked;
      if (hoursWorked === 0) {
        if (r.checkIn && r.checkOut) {
          const diffMs = r.checkOut.getTime() - r.checkIn.getTime();
          const elapsed = Math.floor(diffMs / (1000 * 60));
          hoursWorked = elapsed >= 540 ? 8.0 : elapsed > 0 ? Math.round((Math.min(elapsed, 480) / 60) * 10) / 10 : 8.0;
        } else if (r.status === "present" || r.status === "late") {
          hoursWorked = 8.0;
        } else if (r.status === "half_day") {
          hoursWorked = 4.0;
        }
      }

      return {
        _id: r.id,
        id: r.id,
        userId: {
          _id: r.user.id,
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          employeeId: r.user.employeeId || undefined,
        },
        date: r.date,
        checkIn: r.checkIn.toISOString(),
        checkOut: r.checkOut ? r.checkOut.toISOString() : null,
        status: r.status === "half_day" ? "half-day" : r.status === "on_leave" ? "on-leave" : r.status,
        hoursWorked,
        notes: r.notes || "",
        overtimeMinutes: r.overtimeMinutes,
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
  } catch (error: any) {
    console.error("GET /api/v2/attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
