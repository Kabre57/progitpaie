import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/database/tenant-context";
import { ApiResponse } from "@/types";
import {
  CreateShiftUseCase,
  ListShiftsUseCase,
} from "@/lib/application/attendance/use-cases/ShiftUseCases";
import type { ShiftRecord } from "@/lib/application/attendance/ports/ShiftRepository";
import { PrismaShiftRepository } from "@/lib/infrastructure/repositories/prisma/PrismaShiftRepository";

const repository = new PrismaShiftRepository();
const listShifts = new ListShiftsUseCase(repository);
const createShift = new CreateShiftUseCase(repository);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format horaire HH:mm requis");
const createShiftSchema = z.object({
  name: z.string().trim().min(1).max(120),
  startTime: timeSchema,
  endTime: timeSchema,
  workingHours: z.coerce.number().finite().positive().max(24),
  lateThresholdMinutes: z.coerce.number().int().nonnegative().max(24 * 60).optional(),
});

function serializeShift(shift: ShiftRecord): Record<string, unknown> {
  return { ...shift, _id: shift.id };
}

// GET /api/shifts - Get all active shifts
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
    const shifts = await listShifts.execute(authResult.companyId, includeInactive);
    return NextResponse.json(
      { success: true, data: shifts.map(serializeShift), message: "Horaires récupérés avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get shifts error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les horaires", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create new shift (admin only)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const parsed = createShiftSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données d’horaire invalides", details: parsed.error.issues, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    const shift = await createShift.execute({
      companyId: authResult.companyId,
      ...parsed.data,
      lateThresholdMinutes: parsed.data.lateThresholdMinutes ?? 15,
    });
    return NextResponse.json(
      { success: true, data: serializeShift(shift), message: "Horaire créé avec succès" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SHIFT_NAME_ALREADY_EXISTS") {
      return NextResponse.json(
        { success: false, error: "Un horaire avec ce nom existe déjà", code: "DUPLICATE_ERROR" },
        { status: 409 }
      );
    }
    console.error("Create shift error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer l’horaire", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
