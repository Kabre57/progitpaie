import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { PrismaAttendanceRepository } from "@/lib/infrastructure/repositories/prisma/PrismaAttendanceRepository";
import { CheckInUseCase } from "@/lib/application/attendance/use-cases/CheckInUseCase";
import { checkInSchema } from "@/shared/validation/attendance-v2.schema";
import { ApiResponse } from "@/types";

const repository = new PrismaAttendanceRepository();
const checkInUseCase = new CheckInUseCase(repository);

// POST /api/v2/attendance/check-in - Pointage d'arrivée (V2 Clean Architecture)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const parseResult = checkInSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Données de pointage invalides", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = await checkInUseCase.execute({
      companyId: authResult.companyId,
      userId: authResult.userId,
      location: parseResult.data.latitude && parseResult.data.longitude
        ? {
            latitude: parseResult.data.latitude,
            longitude: parseResult.data.longitude,
            accuracyMeters: parseResult.data.accuracyMeters,
            distanceMeters: parseResult.data.distanceMeters,
          }
        : undefined,
      notes: parseResult.data.notes,
    });

    return NextResponse.json(
      { success: true, data, message: "Pointage d'arrivée enregistré" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v2/attendance/check-in error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du pointage", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }
}
