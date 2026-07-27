import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/middleware-helpers";
import { LoanType, LoanStatus, Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

// GET /api/loans - Liste des prêts et avances
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Prisma.LoanWhereInput = {};
    if (user.role === "employee") {
      where.userId = user.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status as LoanStatus;
    }

    const loans = await prisma.loan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
        schedules: { orderBy: { paidAt: "desc" } },
      },
    });

    const formattedLoans = loans.map((l) => ({
      ...l,
      _id: l.id,
      userId: { ...l.user, _id: l.user.id },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedLoans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get loans error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch loans",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/loans - Créer un dossier de prêt ou avance sur salaire (admin)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { userId, type, amount, monthlyDeduction, startDate } = body;

    if (!userId || !amount || !monthlyDeduction || !startDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé, Montant total, Retenue mensuelle et Date sont requis",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const totalAmount = parseFloat(amount);
    const deduction = parseFloat(monthlyDeduction);

    const loan = await prisma.loan.create({
      data: {
        userId,
        type: (type || "PRET") as LoanType,
        amount: totalAmount,
        monthlyDeduction: deduction,
        totalRepaid: 0,
        remainingAmount: totalAmount,
        startDate: new Date(startDate),
        status: LoanStatus.active,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const responseData = {
      ...loan,
      _id: loan.id,
      userId: { ...loan.user, _id: loan.user.id },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Dossier de prêt / avance créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create loan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create loan",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
