import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { OvertimeStatus, Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

// GET /api/overtime - Liste des heures supplémentaires
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.OvertimeWhereInput = {};
    if (user.role === "employee") {
      where.userId = user.userId;
    }
    if (status) {
      where.status = status as OvertimeStatus;
    }

    const overtimes = await prisma.overtime.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    const formattedOvertimes = overtimes.map((o) => ({
      ...o,
      _id: o.id,
      userId: { ...o.user, _id: o.user.id },
      approvedBy: o.approvedBy ? { ...o.approvedBy, _id: o.approvedBy.id } : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedFormatted(formattedOvertimes),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get overtime error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch overtime records",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

function formattedFormatted(data: any) {
  return data;
}

// POST /api/overtime - Soumission / Saisie d'heures supplémentaires
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { userId, date, minutes, rate, reason } = body;

    const targetUserId = user.role === "admin" && userId ? userId : user.userId;

    if (!date || !minutes || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Date, Nombre de minutes et Motif sont requis",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const overtime = await prisma.overtime.create({
      data: {
        userId: targetUserId,
        date: new Date(date),
        minutes: parseInt(minutes, 10),
        rate: rate ? parseFloat(rate) : 1.15, // 15% par défaut
        reason: reason.trim(),
        status: user.role === "admin" ? OvertimeStatus.approved : OvertimeStatus.pending,
        approvedById: user.role === "admin" ? user.userId : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const responseData = {
      ...overtime,
      _id: overtime.id,
      userId: { ...overtime.user, _id: overtime.user.id },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Heures supplémentaires enregistrées avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create overtime error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit overtime",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
