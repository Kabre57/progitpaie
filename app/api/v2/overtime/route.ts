import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { createOvertimeSchema, listOvertimeQuerySchema } from "@/shared/validation/overtime-v2.schema";
import { ApiResponse } from "@/types";

// GET /api/v2/overtime - Liste des déclarations d'heures supp. avec informations salarié (V2 Clean Architecture)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const parseResult = listOvertimeQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de recherche invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const records = await prisma.overtime.findMany({
      where: {
        companyId: authResult.companyId,
        ...(parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined)
          ? { userId: parseResult.data.userId || authResult.userId }
          : {}),
        ...(parseResult.data.status ? { status: parseResult.data.status as any } : {}),
        ...(parseResult.data.startDate || parseResult.data.endDate
          ? {
              date: {
                ...(parseResult.data.startDate ? { gte: new Date(parseResult.data.startDate) } : {}),
                ...(parseResult.data.endDate ? { lte: new Date(parseResult.data.endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, employeeId: true },
        },
      },
      orderBy: { date: "desc" },
    });

    const data = records.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      userId: r.userId,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        employeeId: r.user.employeeId || undefined,
      },
      attendanceId: r.attendanceId,
      date: r.date.toISOString(),
      minutes: r.minutes,
      rate: r.rate,
      reason: r.reason,
      status: r.status,
      approvedById: r.approvedById,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/overtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v2/overtime - Déclarer des heures supp. (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = createOvertimeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données d'heures supplémentaires invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const created = await prisma.overtime.create({
      data: {
        companyId: authResult.companyId,
        userId: parseResult.data.userId,
        date: new Date(parseResult.data.date),
        minutes: parseResult.data.minutes,
        rate: parseResult.data.rate,
        reason: parseResult.data.reason,
        status: "pending",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, employeeId: true },
        },
      },
    });

    const data = {
      id: created.id,
      companyId: created.companyId,
      userId: created.userId,
      user: {
        id: created.user.id,
        name: created.user.name,
        email: created.user.email,
        employeeId: created.user.employeeId || undefined,
      },
      date: created.date.toISOString(),
      minutes: created.minutes,
      rate: created.rate,
      reason: created.reason,
      status: created.status,
    };

    return NextResponse.json(
      { success: true, data, message: "Heures supplémentaires déclarées" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/overtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de déclaration", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
