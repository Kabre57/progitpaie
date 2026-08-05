import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { OverrideAttendanceStatusUseCase } from "@/lib/application/attendance/use-cases/OverrideAttendanceStatusUseCase";
import { toAttendanceDTO } from "@/lib/application/attendance/mappers/attendance-dto.mapper";
import { overrideAttendanceStatusSchema } from "@/shared/validation/attendance-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaAttendanceRepository();
const overrideUseCase = new OverrideAttendanceStatusUseCase(repository);

// GET /api/v2/attendance/[id] - Obtenir un enregistrement de pointage (V2 Clean Architecture)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const attendance = await repository.findByIdForTenant(authResult.companyId, id);
    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Enregistrement non trouvé", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: toAttendanceDTO(attendance) }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v2/attendance/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// PUT /api/v2/attendance/[id] - Modifier le statut de pointage par un administrateur (V2 Clean Architecture)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = overrideAttendanceStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Statut de pointage invalide", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await overrideUseCase.execute({
      companyId: authResult.companyId,
      adminId: authResult.userId,
      attendanceId: id,
      newStatus: parseResult.data.status,
      notes: parseResult.data.notes,
    });

    return NextResponse.json(
      { success: true, data, message: "Statut de pointage mis à jour" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/v2/attendance/[id] error:", error);
    const status = error.message.includes("non trouvé") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de mise à jour", code: "SERVER_ERROR" },
      { status }
    );
  }
}
