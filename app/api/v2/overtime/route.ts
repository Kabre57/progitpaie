import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaOvertimeRepository } from "@/lib/infrastructure/repositories/prisma/PrismaOvertimeRepository";
import { OvertimeRequest } from "@/lib/domain/overtime/entities/OvertimeRequest";
import { OvertimeRate } from "@/lib/domain/overtime/value-objects/OvertimeRate";
import { OvertimeStatus } from "@/lib/domain/overtime/value-objects/OvertimeStatus";
import { createOvertimeSchema, listOvertimeQuerySchema } from "@/shared/validation/overtime-v2.schema";
import { ApiResponse } from "@/types";

const overtimeRepo = new PrismaOvertimeRepository();

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

    const records = await overtimeRepo.list({
      companyId: authResult.companyId,
      userId: parseResult.data.userId || (authResult.role === "employee" ? authResult.userId : undefined),
      status: parseResult.data.status,
      startDate: parseResult.data.startDate,
      endDate: parseResult.data.endDate,
    });

    const data = records.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      userId: r.userId,
      user: {
        id: r.userId,
        name: "Salarié",
        email: "",
        employeeId: undefined,
      },
      attendanceId: r.attendanceId,
      date: r.date.toISOString(),
      minutes: r.minutes,
      rate: r.rate.value,
      reason: r.reason,
      status: r.status.value,
      approvedById: r.approvedById,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/v2/overtime error:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message, code: "SERVER_ERROR" },
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

    const domainOvertime = new OvertimeRequest({
      companyId: authResult.companyId,
      userId: parseResult.data.userId,
      date: new Date(parseResult.data.date),
      minutes: parseResult.data.minutes,
      rate: OvertimeRate.create(parseResult.data.rate ?? 1.15),
      reason: parseResult.data.reason,
      status: OvertimeStatus.pending(),
    });

    const created = await overtimeRepo.save(domainOvertime);

    const data = {
      id: created.id,
      companyId: created.companyId,
      userId: created.userId,
      user: {
        id: created.userId,
        name: "Salarié",
        email: "",
        employeeId: undefined,
      },
      date: created.date.toISOString(),
      minutes: created.minutes,
      rate: created.rate.value,
      reason: created.reason,
      status: created.status.value,
    };

    return NextResponse.json(
      { success: true, data, message: "Heures supplémentaires déclarées" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/v2/overtime error:", error);
    const message = error instanceof Error ? error.message : "Erreur de déclaration";
    return NextResponse.json(
      { success: false, error: message, code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
