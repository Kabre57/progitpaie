import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

interface AttendanceRecord {
  _id: string;
  id: string;
  userId: {
    _id: string;
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  date: string;
  checkIn: Date;
  checkOut: Date | null;
  status: string;
  hoursWorked: number;
  notes: string;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AttendanceResponse>>> {
  try {
    const user = await requireTenant(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10);

    const where: Prisma.AttendanceWhereInput = {};

    if (user.role === "employee") {
      where.userId = user.userId;
    } else {
      where.user = { companyId: user.companyId };
    }

    if (monthParam) {
      if (monthParam.includes("-")) {
        const startDate = `${monthParam}-01`;
        const [year, monthNum] = monthParam.split("-").map(Number);
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${monthParam}-${lastDay.toString().padStart(2, "0")}`;
        where.date = { gte: startDate, lte: endDate };
      } else {
        const mNum = parseInt(monthParam, 10);
        const yNum = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        const mStr = String(mNum).padStart(2, "0");
        const startDate = `${yNum}-${mStr}-01`;
        const lastDay = new Date(yNum, mNum, 0).getDate();
        const endDate = `${yNum}-${mStr}-${lastDay.toString().padStart(2, "0")}`;
        where.date = { gte: startDate, lte: endDate };
      }
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    const formattedRecords: AttendanceRecord[] = records.map((r) => ({
      _id: r.id,
      id: r.id,
      userId: {
        _id: r.user.id,
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        department: r.user.department?.name || null,
      },
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      hoursWorked: r.hoursWorked,
      notes: r.notes,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<ApiResponse<AttendanceResponse>>(
      {
        success: true,
        data: {
          records: formattedRecords,
          total,
          page,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
