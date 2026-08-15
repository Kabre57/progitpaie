import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware-helpers";
import { ApiResponse } from "@/types";
import {
  DeactivateShiftUseCase,
  UpdateShiftUseCase,
} from "@/lib/application/attendance/use-cases/ShiftUseCases";
import type { ShiftRecord } from "@/lib/application/attendance/ports/ShiftRepository";
import { PrismaShiftRepository } from "@/lib/infrastructure/repositories/prisma/PrismaShiftRepository";

const repository = new PrismaShiftRepository();
const updateShift = new UpdateShiftUseCase(repository);
const deactivateShift = new DeactivateShiftUseCase(repository);
const idSchema = z.string().trim().min(1);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format horaire HH:mm requis");
const updateShiftSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  workingHours: z.coerce.number().finite().positive().max(24).optional(),
  lateThresholdMinutes: z.coerce.number().int().nonnegative().max(24 * 60).optional(),
}).refine((input) => Object.values(input).some((value) => value !== undefined), {
  message: "Au moins un champ doit être fourni",
});

function serializeShift(shift: ShiftRecord): Record<string, unknown> {
  return { ...shift, _id: shift.id };
}

function expectedError(error: unknown): NextResponse<ApiResponse<unknown>> | null {
  if (error instanceof Error && error.message === "SHIFT_NOT_FOUND") {
    return NextResponse.json(
      { success: false, error: "Horaire introuvable", code: "NOT_FOUND" },
      { status: 404 }
    );
  }
  if (error instanceof Error && error.message === "SHIFT_NAME_ALREADY_EXISTS") {
    return NextResponse.json(
      { success: false, error: "Un horaire avec ce nom existe déjà", code: "DUPLICATE_ERROR" },
      { status: 409 }
    );
  }
  return null;
}

// PUT /api/shifts/[id] - Update shift (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) {
      return NextResponse.json({ success: false, error: "Contexte entreprise requis", code: "UNAUTHORIZED" }, { status: 403 });
    }

    const parsedId = idSchema.safeParse((await params).id);
    const parsedInput = updateShiftSchema.safeParse(await request.json());
    if (!parsedId.success || !parsedInput.success) {
      return NextResponse.json(
        { success: false, error: "Données d’horaire invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await updateShift.execute({ companyId: authResult.companyId, id: parsedId.data, ...parsedInput.data });
    return NextResponse.json(
      { success: true, data: serializeShift(updated), message: "Horaire mis à jour avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const expected = expectedError(error);
    if (expected) return expected;
    console.error("Update shift error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de mettre à jour l’horaire", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/shifts/[id] - Soft delete shift (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    if (!authResult.companyId) {
      return NextResponse.json({ success: false, error: "Contexte entreprise requis", code: "UNAUTHORIZED", data: null }, { status: 403 });
    }

    const parsedId = idSchema.safeParse((await params).id);
    if (!parsedId.success) {
      return NextResponse.json(
        { success: false, error: "Identifiant d’horaire invalide", code: "VALIDATION_ERROR", data: null },
        { status: 400 }
      );
    }
    await deactivateShift.execute(authResult.companyId, parsedId.data);
    return NextResponse.json(
      { success: true, message: "Horaire supprimé avec succès", data: null },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SHIFT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Horaire introuvable", code: "NOT_FOUND", data: null },
        { status: 404 }
      );
    }
    console.error("Delete shift error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer l’horaire", code: "SERVER_ERROR", data: null },
      { status: 500 }
    );
  }
}
