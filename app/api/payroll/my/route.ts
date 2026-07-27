import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

// GET /api/payroll/my - Get employee's own payslips
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "0", 10);
    const year = parseInt(searchParams.get("year") || "0", 10);

    const where: Prisma.PayrollWhereInput = { userId: user.userId };

    if (month) where.month = month;
    if (year) where.year = year;

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const formattedPayrolls = payrolls.map((p) => ({
      ...p,
      _id: p.id,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedPayrolls,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get my payroll error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payslips",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
